# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
as a private monorepo, releases are tracked by date and Workers version rather
than a semver tag.

## [2026-11-01c] — gap-closure S3-M3.4: the growth-nowcast and survey family — GDPNow, Empire State, continuing claims, median CPI, sticky CPI, SLOOS (the 112th–117th indicators)

S3's third build milestone: the spec's "Growth nowcast and surveys" — the
real-time growth read the gap analysis flagged (GDPNow) plus the survey,
labour-persistence and quiet-inflation context around it. All six cards
are CONTEXT-ONLY per G-5; no growth voter changed (the spec's rule).

- **The six indicators** (all context, P1 info rules — the 112th–117th):
  `gdpnow` (Atlanta Fed GDPNow, FRED GDPNOW — the running estimate of the
  CURRENT quarter's real GDP growth, quarterly first-day stamps: the stamp
  IS the quarter it refers to, VERIFIED against the Atlanta Fed's own page
  2026-11-01: "3.2% Fourth-Quarter GDPNow Estimate for 2026:Q4, updated
  October 29, 2026" == FRED 3.2217 @ 2026-10-01), `empire-state` (the New
  York Fed's Empire State manufacturing survey, FRED GACDISA066MSFRBNY —
  the philly-fed twin), `continuing-claims` (FRED CCSA — the stock of
  people receiving benefits beside initial-jobless-claims' flow),
  `median-cpi` (Cleveland Fed median CPI, 12-month, FRED
  MEDCPIM158SFRBCLE), `sticky-cpi` (Atlanta Fed sticky-price CPI,
  12-month, FRED STICKCPIM158SFRBATL — the YoY sibling of the spec's MoM
  id, the M3.1-recorded deviation) and `sloos-ci-tightening` (the Senior
  Loan Officer Survey's net share of banks tightening business lending,
  FRED DRTSCILM — the credit-conditions read beside EBP). Placed:
  growth-health (gdpnow, empire-state, continuing-claims), prices-heat
  (median-cpi, sticky-cpi, beside the CPI family) and market-stress
  (sloos-ci-tightening, beside ebp — the spec's own credit framing).
- **Zero new fetches:** the series already rode the rung4 'fred-s3' macro
  group from M3.2 day one (GDPNOW, GACDISA066MSFRBNY, CCSA rode the
  liquidity group, MEDCPIM158SFRBCLE, STICKCPIM158SFRBATL, DRTSCILM —
  fetched daily since 2026-11-01, the cards land here). The six ids join
  RUNG4_IDS (the main rung carries them; the 04:25/04:27 daily halves and
  the 04:40 periodic rung exclude them; the 04:35 phase writes their
  history keys — the rung's history writes grow 6 → 12; KV writes/day
  ~+6) and `deriveRung4IndicatorSeries` derives them directly (no legs, no
  joins — a missing series omits its card and the reading carries).
- **T-16 + licence walk:** six new records in `data/fred-copyright.json`,
  re-verified live 2026-11-01 from each series page's own schema.org
  license field — GDPNOW, GACDISA066MSFRBNY, MEDCPIM158SFRBCLE and
  STICKCPIM158SFRBATL citation-required (displayed with the FRED
  attribution per the licence walk), CCSA and DRTSCILM public domain;
  UPSTREAM_LEGS + READING_SOURCES rows for all six. No sanity bands —
  every family precedent (us-gdp-growth, philly-fed,
  initial-jobless-claims, us-cpi-yoy) carries none.
- **`staleAfterDays` discipline** (each verified from the provider's own
  rhythm): gdpnow 150 (the stamp only advances quarterly; the next
  quarter's initial nowcast lands within days of the advance GDP release —
  the newest stamp ages up to ~120d), empire-state 60 (the philly-fed
  convention: publishes mid-month for the same month), continuing-claims
  28 (the DOL print carries a built-in ~12-day lag — the freshest print
  2026-11-01 carries the 2026-10-17 Saturday stamp; 28 = one missed print
  plus grace), median-cpi + sticky-cpi 75 (the us-cpi-yoy monthly
  convention) and sloos-ci-tightening 215 (quarterly first-month stamps
  publishing in the survey quarter's third month — the July stamp serves
  until the October survey publishes ~Dec 3, the us-gdp-growth
  convention).
- **Copy:** full bilingual indicator copy + layer-1 entries for all six
  (round-64, Persian-copy manifest recorded) + the `nowcast` glossary term
  (the M3.6 list, landed with the card that uses it — glossary 36 → 37
  ×2); the narrator vocabulary regenerated (146 indicators + 37 terms ×2).
  Every historical number in the copy is extracted from the provider's own
  fixture data (GDPNow's decade range −32.08/+36.97 pandemic quarters and
  the 1.2–4.2 of the last five quarters; Empire State's −80/+35.8 decade;
  CCSA's 23m pandemic spike and the 1.34–1.96m range since 2022; median
  1.14/7.84; sticky −1.76/8.31; SLOOS's +71.2 (2020-07) / −32.4 (2021-07)
  and the current ~0).
- **Numbers:** gates ALL GREEN — 11,495 tests (insights 1081 · web 9746
  (+354) · api 393 · core 195 · scraper 67 · markets 13; the layer-1
  strict validator 8,961 assertions). Insights lazy 1227/291 → **1258/299**
  (measured 1256.69/297.49; the largest single-milestone copy batch of S3 —
  justified in check-bundle-budget.mjs). Registry 117 indicators (74 P1 /
  43 P2; 69 info rules).

## [2026-11-01b] — gap-closure S3-M3.3: the credit-stress pair — EBP and the OFR FSI, two new rung4 sources (the 110th–111th indicators)

S3's second build milestone: the spec's "Credit stress sources" — the
licence-clean substitutes the gap analysis demanded after the ICE BofA
rejection (the market-stress gauge's credit leg). Both cards are
CONTEXT-ONLY per G-5.

- **The two indicators** (all context, P1 info rules — the 110th–111th):
  `ebp` (the Fed Board's own Excess Bond Premium file, the `ebp` column of
  `ebp_csv.csv` — the piece of corporate bond spreads left over after the
  expected-default compensation is subtracted) and `ofr-fsi` (the OFR
  Financial Stress Index, the AGGREGATE column of the file DISCOVERED in
  M3.1 — `financial-stress-index/data/fsi.csv`; the 9 component/region
  columns are documented but stay uncarded, the layer-1 copy explains them
  in words). Placed in the `market-stress` lane beside their stress-index
  siblings.
- **Ingest capacity:** the fetches ride the rung4 04:35 slot as TWO new
  extra sources — `frb-ebp` (Saturday re-check for the monthly file, the
  CFTC gate's discipline) + `ofr-fsi` (daily gate), each with its OWN phase
  (`runInsightsCreditPhase`) so a failing host never touches the other, the
  S3 FRED groups, or the TIC tables. The rung4 registry total on the day
  every gate fires: 1 + 16 + 10 + 10 = 37/50. The Node venue (GHA 04:20)
  collects the same files inline (`collectCreditSources`) — the venues
  cannot drift. The two hosts answered ~270 ms/~1.2 s in the S1 egress
  probe; the 12 s single-attempt policy stands.
- **Honesty machinery:** the parsers fail closed (exact header text, exact
  column count 4/10, strict ISO dates, strictly ascending rows, finite
  numerics, empty/header-only rejected); NO magnitude bands — both series
  are spreads/indexes that can honestly sit anywhere near zero (the M3.2
  no-invented-bounds lesson); the fetch trims to the SAME fredDecadeFrom
  window the FRED groups ride (121 monthly / 2,616 daily obs at the
  fixture-pinned lengths). `staleAfterDays` 75 (EBP, the us-cpi-yoy monthly
  convention — the file uploads with a 1–2 month lag) and 7 (OFR FSI, the
  ecb-dfr daily convention — business-day publication with a 1–2 day
  lag). The ids joined RUNG4_IDS: the main rung carries them forward, the
  daily halves + the periodic rung exclude them, the phases write their OWN
  history keys.
- **Licence records:** both providers are L0 public domain (17 U.S.C. §
  105 — the Fed Board and the OFR, a Treasury bureau); register rows
  `frb-ebp`/`ofr-fsi` + providers `frb`/`ofr` + the FS-09 method card +
  LICENCES.md/RISK_REGISTER.md rows. No owner_accepts needed (L0).
- **The layer-1 copy:** two glossary terms (excess bond premium, financial
  stress index) + the full bilingual card copy (EN + fa, Persian-copy
  round-63). The history lines quote the providers' own files (EBP peaked
  3.41 in Oct 2008, decade range −0.95..+1.19; OFR FSI peaked 29.32 on
  2008-10-10, decade range −4.36..+10.27); the G2/G3/G5 validators caught
  and fixed three first-draft slips (the St. abbreviation's period
  splitting a sentence, the 'easing' null-termId jargon, the fa plainName's
  stray Latin).
- **Numbers:** tests 10,978 → **11,140 green** (+162: the credit suite +22 in insights — the parser fail-closed cases, the exact-URL/decade-trim fetchers, the phase orchestration + isolation, the registry arithmetic — and the web layer-1 validator's per-field growth +140 for the two new ids and two new glossary terms; plus the 109→111 pin updates). Insights lazy 1214/288 → **1227/291** (measured
  1225.55/290.23; justified here and in check-bundle-budget.mjs). KV
  writes/day ~+9 (two more history keys + the patch writes on their gate
  days); rung4 subrequests ~31/50 on a Saturday, ~21/50 otherwise. The
  glossary count grows 34 → 36 ×2 languages; the narrator vocabulary 140
  indicators + 36 terms ×2.

## [2026-11-01a] — gap-closure S3-M3.2: the US liquidity and funding family — six context cards riding the new rung4 'fred-s3' source (the 104th–109th indicators)

S3's first build milestone: the spec's "Liquidity and term premium from
FRED" — the plumbing the market-stress gauge's story was missing (the spec's
own motivation: "The market-stress gauge has no credit, funding or liquidity
voter"; these cards are CONTEXT-ONLY per G-5, the promotion decision is S6's).

- **The six indicators** (all context, all P1, the 104th–109th):
  `term-premium-10y` (FRED THREEFYTP10, the Kim-Wright premium, daily %),
  `tga` (WTREGEN, the Treasury General Account, weekly Wednesday $M),
  `reverse-repo` (RRPONTSYD, the overnight reverse repo pile, daily $B,
  citation-required — displayed with the FRED attribution), `bank-reserves`
  (WRESBAL, weekly Wednesday $M), and the two DERIVED spreads:
  `repo-stress` (SOFR − IORB, the funding-pressure gauge; inner join on
  common dates, 4dp quantized, the breakeven-tilt discipline) and
  `net-liquidity` (WALCL − TGA − RRP×1000, the money actually available to
  markets; RRP converted $B → $M inside the derivation). Placed in the
  `market-stress` lane (the spec's option 1 — read after gauges.ts, whose
  1:1 group↔gauge mapping makes a context-only "Liquidity and funding"
  group render a permanently-cannot-read gauge; recorded as the choice).
- **Ingest capacity (the rung4 registration — RUNGS.md updated):** the
  fetches NEVER touch the 04:10 main rung (~47/50). The new 'fred-s3'
  extra source rides the 04:35 rung4 slot the S1-M1.7 scaffolding reserved:
  TWO fredgraph ZIP requests (the two truncation-safe 6-id groups verified
  in M3.1) + 3 reads (stage legs, snapshot, status) + 10 writes (6 OWN
  history keys — the 04:25/04:27 daily halves now EXCLUDE the rung4 ids,
  both to keep the CPU-split arithmetic and to keep history ownership clean
  — plus snapshot/public/stage/status patches). Declared budget 16; live
  verified via the manual lever. Day gate: daily (the groups carry daily
  series); the 10:10/20:10 sweeps heal failures within hours.
- **The carry-forward:** the main rung's build now carries RUNG2 ∪ RUNG4
  (`CARRY_FORWARD_IDS` in ingest/run.ts) — at 04:10 the six readings carry
  verbatim from the previous snapshot (their series are absent by design)
  and the 04:35 phase patches them; the Node venue (GHA 04:20 +
  `scripts/ingest.ts`) runs the SAME collection inline (rung4Series), so
  the venues cannot drift (the rung-2 discipline).
- **Honesty machinery:** IORB's administratively announced FUTURE-dated
  rows are trimmed to today at the collect boundary (the M3.1 finding —
  pinned by its own test); the phase fails closed per group (one failing
  ZIP never sinks the other) and per leg (a missing staged SOFR/WALCL leg
  omits the derived card, never a partial number); T-16 records added for
  all five new FRED series (live-verified licence tags 2026-11-01: four
  public-domain + RRPONTSYD citation-required; the WSEFINTL1 record
  untouched); sanity bands only where construction justifies them (the
  three non-negative balance levels — no invented bounds for the spreads).
- **The layer-1 jargon canon:** `liquidity` moves from "must be replaced"
  to a proper glossary term (the yield/bond pattern — still flagged, always
  glossed; wordlists.ts is the shared Layer-1/narrator canon). Six glossary
  terms land (liquidity, term premium, Treasury General Account, reverse
  repo, bank reserves, net liquidity — M3.6's list, arrived with the cards
  that use them), EN + fa (Persian-copy round-62, manifest recorded).
- **Numbers:** tests 10,526 → 10,546 green (+20: the rung4 suite — the
  fixture-ZIP collection, the pure derivations, the phase orchestration,
  the carry-forward, the history-phase exclusion, the registry pins);
  Insights lazy 1179/278 → **1214/288** (measured 1213.69/287.07 — six
  bilingual cards + six glossary terms × 2 dictionaries + the narrator
  vocabulary growth; justified here and in check-bundle-budget.mjs).
  KV writes/day: ~+10 (the phase's 6 histories + 4 patch writes at 04:35;
  page-serve reads unchanged). Subrequests at 04:35: ~15/50.
- **Docs:** RUNGS.md (the rung4 row — no longer empty, the 'fred-s3'
  recipe), VERIFIED-SOURCES (the cosd note: the fredgraph ZIP path IGNORES
  cosd — every member serves full history; probed live 2026-11-01),
  fred-copyright.json (+5 records, 55 total), the scan script's lockstep
  list.

## [2026-10-31y] — gap-closure S2-M2.4 completion: the weekly custody card (FRED WSEFINTL1) — the 103rd indicator, context-only, closing the Who-holds-US-government-debt section

The S2 spec's M2.4 item 6 — "**Weekly custody card** (FRED `WSEFINTL1` once
verified in S3-M3.1, otherwise add the series here following the recipe) …
standard indicator card with 10-year position" — the series was VERIFIED
during S2 itself (2026-10-31 22:20 UTC, recorded in VERIFIED-SOURCES), so
the spec's own conditional fired: the card ships in S2, superseding the
"ships with S3-M3.1" deferral recorded in [2026-10-31w] (recorded in
PROGRESS; the S3 session no longer needs to wire it).

- **The indicator** (`nyfed-custody`, the 103rd, context-only by spec G-5):
  Treasuries held in custody at the New York Fed for foreign official
  accounts — the WEEKLY freshness bridge beside the monthly TIC country
  table that lags ~6–7 weeks. `borrowing-costs` group membership (gauge
  electorate untouched — context never votes), cadence weekly,
  `staleAfterDays: 21` (the walcl precedent: one missed H.4.1-family print
  reads ~10d of obs age; 21 covers two).
- **Zero new fetches:** `WSEFINTL1` rides the SAME mixed-frequency FRED bulk
  group as `WALCL` (both Fed H.4.1-family Wednesday-level weeklies) — the
  live 11-id probe (2026-10-31 22:55 UTC, honest UA) answered the ZIP member
  `weekly,_as_of_wednesday.csv` carrying BOTH columns, latest 2026-10-28
  ($2,838,071 M). One more id inside an existing request: the 04:10 main
  rung's subrequest count is UNCHANGED (~47/50); the group stays at 11/12
  ids (the fredgraph ZIP truncates past ~12 — pinned by test). RUNGS.md's
  main-rung row records the distinction (a series id inside an existing
  request is NOT a new fetch).
- **Licence:** T-16 record added (public domain — the series page's own
  schema.org Dataset license field reads
  `fred.stlouisfed.org/legal/#copyright-public-domain`, read live
  2026-10-31); the fail-closed licence machinery resolves it public. The
  display is the walcl convention ($ millions ×1e-6 → "US$2.84 trillion").
- **The card** (`TicCustodyCard` in TicSection.tsx): the standard
  `CompactRow` anatomy rendered in the SectionLane's ticSlot directly below
  the TicSection — one reading, one surface (`HIDDEN_FROM_LANE_IDS` keeps it
  out of the borrowing-costs lane, the US-global-reach/dollar-strength
  pattern). `ALWAYS_POSITION_IDS` gains the id (the VIX precedent — the
  spec's "with 10-year position"). null reading → nothing renders (the
  section's own loading/empty states are independent); the search filter
  honours it like every card.
- **Copy (Persian round-61):** the full bilingual card copy (13 keys ×2) +
  the layer1 entry, referencing the M2.5 glossary terms that were already on
  main (`treasury-securities`, `foreign-official-holdings`, `central-bank` —
  the parallel M2.5 session's round-60 wording wins the two shared terms by
  landing first; this card consumes them). Terminology follows the
  established «اوراق خزانه‌داری آمریکا» family; no em dash; 24 fa strings
  triaged in the manifest.
- **Narrator:** the custody reading joins the state's fresh items
  automatically (a standard reading) — the vocabulary regenerated at
  132 indicators + 28 glossary terms ×2.
- **Bundle:** Insights lazy chunk 1175/277 → **1179/278** (measured
  1178.46/277.97 at the merged tree — the M2.5 glossary/narrator growth
  from [2026-10-31x] + this card's wrapper and copy; justified in
  `check-bundle-budget.mjs` §2026-10-31y). Entry chunk untouched.
- **The change-scale honesty fix (found during the live verification):**
  `changeScaleOf` was applying the VALUE display scale (e.g. $M→$T ×1e-6)
  to PCT-kind changes — which are already unit-independent percentages —
  so every $-level pct card squashed real moves to "±0.00%" (the live
  walcl row read "−0.00% 30-day" for a −0.03% move; m2-us, retail-sales,
  housing-permits, job-openings and au-housing-finance carried the same
  defect). The scale now converts POINTS-kind changes only (the C5
  behavior unchanged); all four call sites pass the definition's
  changeKind. Pinned by test (the custody card renders "−1.12%", walcl
  "−0.03%", recession-probability keeps ×100).
- **Tests:** +9 (the bulk-group membership/≤12-cap/one-group pin; the
  custody card renders name + trillion display + the 10-year position bar,
  the fa twin with Persian digits; null renders nothing; the one-surface
  invariant; the changeScaleOf honesty pair) + the updated pins (45 FRED
  series, 103 ids, 60 P1, the 55-entry info list, 132+28 vocabulary, the
  merged-manifest counts). Gates ALL GREEN at the merged tree —
  **10,526 tests**.

## [2026-10-31x] — gap-closure S2-M2.5: the foreign-holders glossary terms, the narrator's TIC facts (PROMPT_VERSION 9), the About-source row

The bilingual/licence close of the owner's top-priority feature.

- **Glossary (the spec's five, both languages, round-60):** Treasury
  securities («اوراق خزانه‌داری آمریکا»), foreign official holdings,
  net purchases («خرید خالص»), valuation change («تغییر ارزش»),
  custody hub («مرکز امانت‌داری») — plain one-sentence definitions;
  the narrator vocabulary grows 23 → 28 terms ×2.
- **The narrator now knows who holds US debt:** the GLOBAL section's
  state carries a compact `tic` block (dataMonth, totalTn, the
  Japan/China six-month changes + 12-month net TRANSACTIONS sums, the
  top-3 buyers/sellers, the custodyNote) — the page's OWN derived
  numbers; the AI only explains. The cron reads `insights:tic:v1`
  (+1 KV read on the :50 rung); a missing key degrades calmly. The
  prompt weaves one-or-two facts with the no-causes rule intact; the
  template fallback renders the total + the headline holders (two
  sentences — V2's 35-word cap; Persian holder names + the digit
  mapper, pinned by the V1–V11 validators). Golden fixtures updated
  (global-live gains a REAL tic input + the expected projection).
  Stored narratives regenerate on the next :50 rung.
- **About this data:** the TIC provider row (the register's `us-tic`
  mirrored; the pin test extended) + `COMPOSITE_SOURCE_ROWS` — the
  composite datasets the per-indicator sidecar never lists, honestly
  in the table. Live-verified: "U.S. Treasury TIC (SLT tables —
  foreign holdings of US Treasuries) · 2 series · L0".
- **Tests:** gates ALL GREEN — **10,481** (the layer1 validator
  7,930 → 8,000 assertions). Bundle: Insights lazy raw 1170 → 1175
  (the 10 glossary strings ×2 dictionaries; justified).
- **Live:** api worker `3e6dbb2d`; health/tic/insights all 200.

## [2026-10-31w] — gap-closure S2-M2.4: "Who holds US government debt" — the section is LIVE (headline, split bar, movers chips, Japan+China chart, the sortable table, the custody caveat; EN + fa; browser-verified at 360/1200)

The owner's top-priority feature is now on the page: a full section
inside the Global container, directly after the borrowing-costs gauge.

- **The design rule, everywhere:** real net buying/selling (Table 3
  TRANSACTIONS — "Net U.S. Sales") is shown SEPARATELY from the price
  effect (valuation change), and the custody-hub caveat rides the rows
  (the ◆ marker + the "?" tooltip with Treasury's own wording
  paraphrased) plus the section footnote. The netVsValueNote states
  the difference in plain language.
- **Live content (production, data month 2026-08):** the headline
  "Foreign holders owned $9.3 trillion of US Treasuries in August
  2026. Japan held $1,068.3 billion, $171.0 billion less than six
  months earlier; China held $590.7 billion…" (the spec's own verified
  example numbers); the official/private split 40.2%/59.8%; the chips
  — buyers UK/Cayman/Hong Kong vs sellers Japan/China/France (12-month
  transactions); Japan 1,068.3 | −103.6 net | −18.7 price effect in the
  table's first row.
- **The table:** real `<table>` with `th scope` and sortable button
  headers carrying `aria-sort`; top-15 + Australia always visible;
  24-month sparklines (aria-hidden decoration — the row's numbers are
  the text path); the mobile twin is the card list (first 6 + "Show
  all 16 holders"). Sort + Show-all exercised live in the browser.
- **States:** loading skeleton, the calm "being prepared" line, and
  the >70-day stale badge derived at RENDER time from `dataMonth` (the
  shared pure `ticIsStale`) — the endpoint never hides data, the UI
  never presents a stale table as current.
- **Copy:** the full bilingual tic block (~37 keys + 21 country names
  per dictionary; fa **round-60**). Bundle: Insights lazy 1140/269 →
  **1170/277** (measured 1168.82/275.08 — the section + both copy
  blocks; justified).
- **Tests:** +10 (the transactions-not-holdings chips, the stale badge
  both sides of 70 days, sort both directions, the mobile disclosure,
  EN/fa headline, the custody markers, the calm states). Gates ALL
  GREEN — **10,411**.
- **Live + verified:** api worker `33cf5dbe`; EN + fa at 360/1200 px,
  zero console errors, VLM visual pass (evidence/M2.4/, six
  screenshots). The parallel-session merge (the builder's 7 verified
  calendar dates + the manifest union) landed via rebase in `ee4e4dc`.
- **WSEFINTL1 (the weekly custody card's series): VERIFIED** — weekly
  2002-12-18 → 2026-10-28, latest 2,838,071 $M; licence public domain
  (the FRED series page's own tag, read 2026-10-31). The card ships
  with S3-M3.1 (the FRED-family fetch plumbing); the verification is
  recorded so S3 only wires the ingest.

## [2026-10-31v] — gap-closure S2-M2.3: `GET /api/insights/tic` live — one KV read, ETag/304, the kill switch armed; the typed web client; the Treasury-verified calendar entry (round-60)

The owner's top-priority feature now has its public read path: the
`insights:tic:v1` written by rung3 serves at `/api/insights/tic`
exactly like the markets/fx boards.

- **The endpoint:** free + unauthenticated under the shared data-bucket
  rate limit, **exactly one KV read per request** (pinned by test),
  `Cache-Control: public, max-age=300, s-maxage=300` + a
  content-addressed ETag (304 verified on production) + the Worker edge
  cache + `X-Robots-Tag: noindex`. The calm 503s carry distinct machine
  codes (`tic_not_ready` for an absent or POISONED key — the store's
  zod defense degrades to "being prepared", never garbage;
  `tic_unavailable` for a reader rejection). The per-source kill switch
  rides the boards machinery: the registry generator now knows the
  `tic` board (L0 public domain, 17 U.S.C. § 105 — no licence hide), so
  a future generator run without the directive hides it exactly like
  markets/fx.
- **Staleness is honest by construction:** the endpoint serves the
  snapshot VERBATIM (never hides data); the UI derives ">70 days old"
  at render time from `dataMonth` via the shared pure `ticIsStale` — a
  stale table can never present as current (route test pins the
  contract).
- **The typed client** (`apps/web/src/lib/tic.ts`): the markets.ts
  twin — zod-validated with the core `TicSnapshot` contract, last-good
  localStorage paint for offline/instant render, the null error
  surface (any failure → null → "loading"/"being prepared").
- **Calendar:** the `tic` kind (core enum + the NextUpStrip "TIC"
  badge) and the entry `tic-2026-09` — **November 18, 2026** (Sep 2026
  data), verified from the Treasury's own October press-notice PDF
  ("The next release … is scheduled for November 18, 2026"). Later
  dates ride each month's notice (`TIC-press-notice-<Mon>-<YYYY>.pdf`)
  — never guessed. The fa title triaged as Persian-copy round-60
  (terminology consistent with the «اوراق خزانه‌داری آمریکا» family).
- **Bundle:** Insights lazy chunk 1140/268.5 → **1140/269** gz
  (measured 1139.82/268.54 — the client + the zod contract ride the
  lazy chunk; justified in `check-bundle-budget.mjs`).
- **Tests:** +21 (8 api route incl. the stale-serves-verbatim and
  poisoned-key paths; 13 web client). Gates ALL GREEN — **10,401**.
- **Live:** api worker `c49f2983` (22:04 UTC) — `/api/insights/tic`
  200 (45,326 B, dataMonth 2026-08, 21 holders), headers verified,
  ETag→304 verified.

## [2026-10-31u] — gap-closure S2-M2.2: the TIC parser, data model and rung3 registration — `insights:tic:v1` written LIVE via the manual lever (data month 2026-08, 21 holders)

The owner's top-priority feature's ingest layer, live in production. The
two verified SLT tables now flow through a fail-closed parser + builder
into ONE KV key, on the S1-built rung3 (04:30 UTC) — the 04:10 main
rung untouched.

- **`packages/insights/src/tic/` (new):** parse.ts fails closed on every
  spec case (column counts, the units line, the machine field-id row,
  `YYYY-MM` headers, month contiguity, sum-of-parts, plausible
  magnitudes); model.ts merges Table 5 + Table 3 by the explicit
  21-name slug map with the same-vintage guard (both tables must carry
  the same data month — vintages are never mixed), the ≤$0.06bn
  per-country cross-check and the Grand-Total check; `n.a.` transaction
  months are ABSENT, never zeroed (the 2023-02 series break);
  implausible month-over-month jumps (>$50bn AND >60%) are FLAGGED
  (`flaggedMonths`), never dropped. compute.ts derives the honest
  split the section is built on: 12-month net TRANSACTIONS sums
  (Table 3 "Net U.S. Sales" — real buying/selling) vs 12-month
  VALUATION sums (the price effect), plus share/1m/6m/12m changes,
  ranks and the top movers. store.ts: the one-key `insights:tic:v1`
  contract, zod-validated on write AND read, poisoned-key defense.
- **Rung3 registration:** `EXTRA_SOURCES` lands `tic-slt` — budget 4
  (2 fetches + 1 idempotence read + ≤1 write), the release-aware gate
  (daily on the 15th–25th until the new data month appears, otherwise
  Saturdays), sweep-healed within hours on failure. The manual lever
  `POST /internal/insights-ingest?phase=extra` runs it with the day
  gate bypassed (force mode) — the post-deploy verification path.
- **Live proof (production):** first manual trigger 21:31 UTC timed
  out honestly (ticdata >12 s at the fetch-policy 12 s default;
  `failed` recorded, no in-invocation retry — F-11) — the fix is
  `TIC_TIMEOUT_MS = 30 s` (commit `ad64b94`, still ONE attempt; the
  slow-host prescription the treasury yield-curve adapter set), after
  which the 21:40 UTC re-trigger wrote the snapshot —
  `data month 2026-08, 21 holders`, rung budget 5/50, releasedAt
  2026-10-16 (the provider's own Last-Modified). Read back via the CF
  REST API: total 9,331.7 bn (official 3,755.6 / private 5,576.1),
  Japan 1,068.3 bn trending down (−37.0 bn net sales in 2026-08 alone),
  China 590.7 bn, Australia 79.9 bn.
- **Tests:** +49 (45 against the real fixtures with expected values
  cross-checked by awk sums; 4 api-side). Gates ALL GREEN — 10,380.
- **REFRESH_SECRET rotated** (the documented unrecoverable-value
  pattern; new value in `apps/api/.dev.vars`, gitignored) — the manual
  levers needed it and the prior session's sandbox held the old value.
- **Final state:** the temporary verification gates were reverted and
  the committed code is live as worker version `1613fa5c` (21:45:53
  UTC, confirmed via the deployments API).
  Api worker `db71eb3a` (deployed 21:17:32 UTC, verified 100%).

## [2026-10-31t] — gap-closure S2-M2.1: TIC source verification — fixtures, layouts, the L0 licence records

The owner's top-priority feature's data source, verified and pinned before
any parsing code exists (never invent a column name — read the provider's
own response).

- **Fixtures committed** (`packages/insights/fixtures/tic/`): both SLT
  tables recorded 2026-10-31 20:24 UTC — `slt_table5-2026-10-31.txt`
  (top-20 foreign holders, BILLIONS, 13 rolling months 2025-08 → 2026-08)
  and `slt_table3-2026-10-31.txt` (ALL countries, MILLIONS, 2020-01 →
  2026-08, ~80 months per country).
- **The hex-dump verdict:** Table 5 carries real TABs throughout — the
  planning chat's "merged numbers" (`862.5901.3`) was a chat-preview
  artifact, not the file's truth (UK 2025-09 `862.5` + TAB + 2025-08
  `901.3`).
- **Table 3's layout mapped in full** (was "partial"): 10 tab-delimited
  columns (`country, country_code, date, for_treas_pos, for_treas_net,
  for_lt_treas_pos, for_lt_treas_net, for_lt_treas_valchg,
  for_st_treas_pos, for_st_treas_net`), ~106 rows incl. Australia (code
  60089) and the official/private aggregates, Treasury's own custody
  caveat verbatim in the footer, and the **2023-02 series break** — the
  three transactions columns are `n.a.` before it while holdings go back
  to 2020-01. Sign convention pinned: a positive "net U.S. sales" number
  means foreigners NET BOUGHT.
- **Cross-verified T3↔T5** (same provider, independent tables): Japan
  2026-08 `1,068,283 M` = `1,068.3 B`; Grand Total `9,331,654 M` =
  `9,331.7 B`.
- **Licence records:** provider `tic` (licences.ts) + `us-tic`
  (sources.ts) — L0 public domain (17 U.S.C. § 105), the custody caveat
  quoted; LICENCES.md + RISK_REGISTER.md rows; method card
  SCRAPING_SPEC FS-08; VERIFIED-SOURCES.md T3 row partial → verified.
- No runtime change (no indicator ids yet, no generated-file change) —
  no deploy for this milestone. Gates green 10,331.

## [2026-10-31s] — gap-closure S1-M1.7: capacity scaffolding — the generic rung3/rung4 (04:30/04:35 UTC, pluggable, budget-capped, sweep-healed) verified LIVE; RUNGS.md + the new-indicator checklist

The S2–S6 sessions can now add data sources without touching the FULL
04:10 main rung (47/50 subrequests — the free-tier budget's hard rule).

- **`apps/api/src/insights-extra-rungs.ts` (new):** rung3 at 04:30 UTC and
  rung4 at 04:35 (slots verified free). A pluggable `EXTRA_SOURCES`
  registry — each source declares an id, a day gate
  (`firstOfMonthGate` / `weekdayGate` / `dailyGate`, the rung2 discipline),
  a subrequest budget and a run body. The rung enforces the 50-subrequest
  ceiling with a LOUD recorded refusal, writes its own status record
  (`insights:extra-status:rung{3,4}`), and isolates every failure (a
  throwing source never sinks the rung, its neighbours, or the cron).
  The registry ships EMPTY — the S1 landing state.
- **Sweep heal:** the 10:10/20:10 sweeps read the extra statuses too
  (healthy-day cost 1 → 3 KV reads) and re-run failed/blocked/
  format-changed sources with the day gate BYPASSED — a monthly source
  that fails retries within hours, not next month.
- **`docs/gap-closure/RUNGS.md` (new):** the full rung map — every
  rung's time, purpose, subrequests and KV writes, plus the source
  registration recipe. **`docs/gap-closure/NEW-INDICATOR-CHECKLIST.md`
  (new):** the §7 recipe as a PR checklist (the Layer-1 EN/fa coverage
  check reuses the existing strict validator — gate 7 of `pnpm gates`).
- **Live proof (the captured-and-reverted pattern):** a temporary 19:47 UTC
  gate deployed once; `wrangler tail` captured
  `[extra-rung3] 0 source(s) ran · budget 1/50 · status written`, and the
  Cloudflare REST API read the key back verbatim — the empty registry ran
  live and wrote its status. The temp gate was reverted and the committed
  code redeployed (`d1da6f53`). 10 new tests (10,331 total green); no new
  cron trigger.

## [2026-10-31r] — gap-closure S1-M1.6: the five live-page audit fixes — the pegged pair exempted, ONE shared markets count (±1% band stated), the trend column names its window, percentile flags carry the 30-day speed, GPR verified context-by-design

- **#1 usdaed:** a pegged pair's full-precision daily repeat is the peg
  working — `usdaed` joins T-08's unchanged-normal set (the card sat in
  check-pending on 2026-10-30 while the AED peg did its job; a broken feed
  is still caught by the source report). Test-first.
- **#2 markets counts:** every sentence and the stat box now read ONE
  value — the "n of m in correction" line counts the RAW ≥10%-below-high
  rule (the number the cards' distances and the below-high line show; the
  buffered status tags stay per-card memory but no longer pad the
  sentence); the takeaway's up-count is the ±1%-banded today breadth; the
  markets worker's `roseToday` reads the same `TREND_BAND_PCT` (the
  narrator agrees with the box); the flat threshold is stated on the
  breadth box ("A move within ±1% reads as flat.", EN + fa).
- **#3 trend labels:** the markets and FX-pairs column headers now read
  "3m trend" («روند ۳ ماهه») — the label names the window its word
  measures (TAIEX −1.4% today beside "Up" says WHICH Up). Data unchanged.
- **#4 price footing:** a percentile-zone warning's generated line carries
  the 30-day speed — "in the highest 20% of its 10-year range (-7.8% over
  the last 30 days)" — a high level fast unwinding no longer reads as
  fresh stress (the gold/silver audit case). Conditions only; sub-1%
  moves add nothing.
- **#5 GPR:** verified context-only BY DESIGN (the SD regime: z = +0.62 is
  mid-range, so "usual range" is the honest LEVEL; the +20.6-point monthly
  move is the SPEED fact S4's geopolitics gauge is built to score) —
  documented for S4, no code change, nothing tuned louder.
- 7 new tests (10,321 total green); Persian-copy round-59; Insights lazy
  budget 1139/268.5 → 1140/268.5 (measured 1139.36/268.36, justified).
  Deployed BOTH workers: api `d40d187c` + markets `0266f168` (the summary
  computation changed in the markets worker).

## [2026-10-31q] — gap-closure S1-M1.5: the gap-leg date guard (RULE_VERSION 4) — a spread whose legs sit more than 7 days apart is marked and stops voting; the RBA trio's copy states the monthly average it serves; FRED AU mirror verified as the unwired fallback

The 2026-10-31 audit found the AU/US 10-year gap voting on a month-mismatched
pair: the monthly F2.1 leg at Sep 30 silently paired with the daily US leg at
Oct 29. The B-10 machinery (gapLegs + the "dates differ" tag) already showed
both dates on the card — but the reading still voted.

- **The guard (`packages/insights/src/adapters/snapshot.ts`):** any leg-date
  inequality now stamps `datesDiffer` (the T-20 field, added to the core
  schema — T-20 was designed-but-unwired); a divergence beyond
  `GAP_LEG_MAX_DIVERGENCE_DAYS = 7` flips a voting status to 'stale'. The
  value stays a true same-date join, both legs' dates stay visible, the card
  is never hidden — and the M1.4 badge counts the guarded reading on its
  gauge. Applied at all three stamping sites (both gaps in the main build +
  the rung2 patch path). 8 new tests (window boundaries, the audit case,
  within-window marking, pass-throughs).
- **Labels (the bund-10y precedent):** the RBA trio's Layer-1 `whatItIs`
  copy now states the monthly-average, lagged series the cards actually
  serve (EN + fa, Persian-copy round-58) — the old copy claimed the blocked
  daily F2 file ("daily… 2–4 business-day lag" / "published weekly").
- **FRED fallback verified, not wired** (the live F2.1 path is the "first
  that works reliably"): `IRLTLT01AUM156N` — OECD AU long-term yield,
  monthly, latest 5.283 @ 2026-09-01 (the same September value F2.1 serves),
  licence "Copyrighted: Citation Required" read from the series page.
  Recorded in VERIFIED-SOURCES for the day the F2.1 venue fails.
- Gates ALL GREEN — **10,314 tests**; registry + narrator vocabulary
  regenerated (ruleVersion 4); Insights lazy budget 1138/268 → 1139/268.5
  (the corrected copy; justified). Deployed as worker `61097a6a`. Live
  production evidence: the gap card reads "dates differ · What Australia
  pays to borrow for 10 years (Sep 30, 2026) minus What the US government
  pays to borrow for 10 years (Oct 29, 2026)" — the vote-stopper first
  rides tomorrow's 04:20 ingest, and the legs realign when the October
  monthly publishes.

## [2026-10-31p] — gap-closure S1-M1.4: stale-voter honesty — a stale gauge member can never make its gauge look worse (RULE_VERSION 3); the summary names the out-of-date voters; the calm out-of-date badge ships in EN + fa

The gap analysis's core honesty defect, fixed at the arithmetic level: a
stale member was already excluded from voting, but the exclusion SHRANK the
warning-share's denominator — so a calm member's reading going out of date
could RAISE its gauge's step (1 fresh warning + 1 stale member read 1/1 =
100% → "alarmed"; the old test that pinned exactly that is rewritten).

- **Engine (`packages/insights/src/gauges.ts`, RULE_VERSION 3):** the share
  is now warnings over fresh voters PLUS stale members — a stale member
  never votes and never shrinks the base, so staleness can only make a
  gauge MILDER (a warning member going stale lowers the share; a calm one
  leaves it). Unavailable members stay fully excluded (no reading exists to
  dilute with); an all-stale gauge stays step 0, cannot-read. 6 new engine
  tests pin the monotonicity both directions, the all-stale case, the
  unavailable scope guard, and the end-to-end section-verdict guard.
- **Contract:** `SummaryLine` gains additive optional `staleCount` +
  `staleVoters` (zod in `packages/core`) — the ingest's summary now NAMES
  the out-of-date voters; old stored snapshots still parse (the fields are
  optional), and tomorrow's 04:20 ingest is the first to carry them.
- **UI:** the hero verdict cards and the gauge headers show a calm
  "n of m readings out of date" badge (`data-stale-badge`), counted from
  the same pure readings the verdicts come from — the card is never
  hidden. EN `'{n} of {total} readings out of date'` + fa
  «{n} مورد از {total} قرائت قدیمی است» (Persian-copy round-57, recorded
  in the manifest; terminology consistent with `healthStaleChip` /
  `heroStaleSuffix`). 4 new web tests cover presence, counts, the
  unavailable-doesn't-trigger guard and the fa rendering with fa-IR digits.
- **Honest production record:** the live snapshot has NO status-stale
  members today — the RBA trio sits at 31 of its 40-day monthly window
  (the D-21 refinement), so today's verdicts are unchanged (Global
  stressed 9/32 · Australia stressed 7/16, before and after). The badge
  fires naturally when a member actually crosses its window (~2026-11-09
  for the RBA trio absent fresh data). Fixture evidence (the live page
  with the API response's trio forced stale): EN "3 of 16 readings out of
  date" + the gauge header's "3 of 5", fa «۳ مورد از ۱۶ قرائت قدیمی است»,
  the AU inflation gauge 4→3, section verdict steady at 3
  (`docs/gap-closure/evidence/M1.4/`).
- **Budget:** Insights lazy chunk 1136.1/267.5 → 1138/268 (measured
  1137.37/267.78 — the audited badge copy + wiring; justified per the
  gate's rule). Registry (`data/indicators.json` ruleVersion 3) and the
  narrator vocabulary regenerated. Gates ALL GREEN, **10,306 tests**
  (insights 973→979 · web 8677→8681). Deployed as worker `d672a562`.

## [2026-10-31o] — gap-closure S1-M1.3: progress tooling — `pnpm gap:progress` regenerates the PROGRESS.md Summary deterministically (6/6 tests, idempotent)

- **`scripts/gap-progress.mjs`** (new, Node ESM, zero dependencies): parses
  the `### S<n>` session sections of `docs/gap-closure/PROGRESS.md`, counts
  the top-level `- [x]`/`- [ ]` milestone lines only (indented evidence
  sub-bullets and the G1–G13 gap-coverage items are structurally excluded),
  and rewrites the Summary table, the Total row and the last-updated line
  between the new stable markers `<!-- gap-progress:begin/end -->`. Missing
  markers or missing sections fail loudly instead of drifting. A `--check`
  mode exits non-zero when the file is stale (CI-able later).
- **`scripts/gap-progress.test.mjs`** (node:test — the root workspace has no
  vitest package): 6 tests over `tests/fixtures/gap-progress-sample.md`
  covering the counting rules, theme preservation from the existing table,
  regeneration, idempotency (byte-identical second run) and both loud-failure
  paths. `pnpm gap:progress` + `pnpm gap:progress:test` added to the root
  package.json; eslint and all 9 gates green (10,296 tests).
- First real run: the Summary now reads S1 2/7 (29%), total 2/37 (5%),
  generated from the ticks — the hand-maintained numbers are retired.

## [2026-10-31n] — gap-closure S1-M1.2: GitHub Actions diagnosed AND repaired — the billing hold (owner-side, lifted 14:34 UTC) + the invalid shiller-fetch workflow (repo-side, fixed); first-ever green shiller run, dry-run ingest green, CI green

Two verified causes behind the "Actions red since 2026-10-20" premise:

- **Billing hold (owner-side, now lifted).** GitHub's own job annotation on
  the failed scheduled runs read: *"The job was not started because recent
  account payments have failed or your spending limit needs to be increased.
  Please check the 'Billing & plans' section in your settings."* Every
  scheduled `insights-ingest`/`insights-selfcheck` run failed in ~2s with no
  runner allocated, from 2026-10-19 23:25 UTC. The hold lifted 2026-10-31
  ~14:34 UTC (first green CI run #363) — push/PR runs green since, and a
  `workflow_dispatch` `dry_run=true` ingest (#56) completed green, proving
  the GHA venue is fully functional again without touching KV.
- **Invalid workflow file (repo-side, fixed in `3f1ef72`).**
  `shiller-fetch.yml` carried a top-level `timeout-minutes` — invalid GitHub
  workflow syntax — so GitHub rejected the whole file: every push since
  2026-10-19 produced a zero-job instant "failure" pseudo-run (the file has
  no push trigger at all; the runs were parser-rejection artifacts) and the
  workflow had **never executed once**. The key now lives at job level (the
  `insights-ingest` pattern). **Run #141 — its first-ever execution — went
  green end-to-end and pushed its designed monthly archive commit
  (`3625afa`, data/shiller refreshed).**
- Stale comments corrected (`insights-ingest.yml` minutes-exhaustion note →
  the verified billing timeline; "the repo is private" → public) and
  `docs/DEPLOY.md` "Repairing CI" rewritten as a RESOLVED record with the
  recurrence playbook. `docs/gap-closure/PROGRESS.md` M1.2 ticked with the
  watch item: the 04:20/04:50 scheduled runs should resume 2026-11-01 — if
  the annotation returns, it is the billing hold again (owner-side).

## [2026-10-31m] — gap-closure S1-M1.1: the session opens — baseline re-verified (10,296 tests green) + the Worker-egress probe table (13 hosts; NY Fed fine, ArcGIS slow, FiscalData blocked, RBA 403 re-confirmed)

The gap-closure program's first session (docs/gap-closure/S1-foundation-and-trust.md).
Ground truth before anything shipped: `pnpm install` + `pnpm gates` on a clean
clone of `main` (`d4d62a1`) — **ALL 9 GATES GREEN, 10,296 tests in 1m49s**, the
same counts the Gold Program S6 recorded. The probe then answered the program's
biggest unknown — what can Worker egress actually reach:

- **`docs/gap-closure/VERIFIED-SOURCES.md`** gained the "Worker egress"
  section: a temporary Worker `currena-probe` (deployed 17:31 UTC, deleted
  after — the URL 404s) fetched 15 URLs across 13 hosts ONCE each with the
  declared honest UA `CurrenaDashboard/1.0` (F-09/T-25), single attempt, two
  full runs + one targeted 30s re-run. Verdicts: **NY Fed GSCPI 200 in ~0.5s**
  (the register's Akamai fear did not materialize — S4 can build it from the
  Worker); **TIC tables 200 but slow (8–10s)** — S2's parser must keep the
  honest single-attempt 12s policy with <4s margin; **ArcGIS 200 only past
  12s** (first byte 12.5s at a 30s budget — S4 needs a longer `timeoutMs` or
  the GHA venue); **FiscalData API hard-blocked from Workers (timeout ×3 at
  12s/12s/30s** while a normal client gets 200 JSON in <1s — S3's
  fiscal/auction work must use the GHA venue, exactly like RBA); **RBA 403
  re-confirmed** (M1.5 proceeds on mirrors); ECB, FRED, ABS, Yahoo,
  stats.govt.nz, Fed Board, policyuncertainty, matteoiacoviello all 200.
- **`docs/gap-closure/PROGRESS.md`**: M1.1 ticked with the baseline evidence,
  the credential-verification record, and the honest rotation note (the owner
  re-pasted identical token values and instructed the session to use them;
  rotation remains the top owner action item — nothing was printed, logged or
  committed).

## [2026-10-31l] — Gold Program S6 wrap-up: the reminder spec (GOLD_RECHECK_SPEC.md) — the procedure home for every later re-check + re-backtest; the session fully closed (everything pushed, merged, deployed)

The owner's wrap-up round. State verified end-to-end first: `main` =
`4e480b9` = origin (CI green on it), zero open PRs, production at
`21ca25ab` (100%, healthy — `/api/health` ok, the 21-voter table
computing). Then the durable piece the owner asked for:

- **`docs/insights/GOLD_RECHECK_SPEC.md` (new)** — the owner's
  reminder: a self-contained procedure spec so a future session
  ("after a while" — a week, a month, a quarter) can re-check and
  re-backtest the gold table without reconstructing context. It
  carries: §0 a paste-able session starter · §1 the state-of-record
  (updated on every re-run) · §2 the armed 2026-11-02 04:30 UTC
  one-shot + what to do if it fired early or never fired · §3 the
  seven-step procedure (the live check → the read-only-KV credential
  gate with the REAL-read test → `gold-corpus-dump` → `gold-backtest`
  → the baseline comparison with the which-engine-stamped-what rule →
  the watch step → record + ship with the gates) · §4 the asOf-watch
  verdict rules (lockstep → validated-by-watch, still not "proven";
  divergence → escalate, no silent code change; weekends are not
  divergence) · §5 the comparison-baseline table (S4 51.7/46.9/43.9 ·
  S6 52.1/47.6/43.9, the tilt 46.7%, the mature-base nuance) + the
  standing round-55 honest note no re-run may soften · §6 the
  escalation rules (the stated-in-advance edge rule, watch
  divergence, tilt fire-rate band, missing archives, KV ceiling —
  re-checks REPORT, they never decide; voter-table changes open
  their own gated session, the D-5 pattern) · §7 security + what
  NOT to do (read-only KV, credentials in env only, no edge claims)
  · §8 the re-arm recipe for future one-shots (~04:30 UTC past that
  day's ingest rung).
- **Indexed:** the insights README's reading-order table +
  GOLD_BACKTEST_SPEC's known-gaps item 7 (the "re-run as the archive
  grows" item now points at the spec) + the AGENTS.md NEXT pointer.
- **The standing honest note, restated:** the re-check exists to
  measure, not to hunt — the round-55 note ("no positive association
  with the next 5–60 days — conditions, not direction") stays the
  operative description until a re-run's stated-in-advance rule says
  otherwise.

## [2026-10-31k] — Gold Program S6 deploy: LANDED LIVE (21ca25ab) — the 21-voter table rides production; the Insights chunk byte-identical; goldSummary −2/headwind exactly as predicted

The fifth credential round closed the last open S6 item. The owner's
"Workers API" token (`cfut_dGmEj…`) verified ACTIVE at
/user/tokens/verify and passed the real scope tests (Workers services
list · KV namespaces list), the runbook ran in order, and the promoted
21-voter table now computes in production:

- **Gates first:** `pnpm gates` ALL GREEN (1m56s) — 10,296 tests · secret
  scan 8·687 · typecheck 6 · lint 0/0 · copy:audit · narrator vocabulary
  131×2+23×2 · narrator eval 50 · layer1 strict 7930/7930 · budget entry
  294.45/88.48 · Insights lazy 1136.01/267.29 (ceiling 1136.10). Then the
  deploy-lock check: production at `d77e9139` since 15:16:34 UTC (the S5
  deploy) — no parallel session. Clear.
- **DEPLOY:** `pnpm --filter @currena/api exec wrangler deploy` (SPA freshly
  built by the gates' build step) → **currena-api version
  `21ca25ab-295f-40f6-83ee-4fb2ca6ad210` at 100%** (17 new files, 103
  already uploaded; RATES KV + AI + ASSETS + the narrator vars +
  SITE_MODE=public intact; cron `* * * * *`).
- **Live-verified end-to-end:** `/api/health` ok on both
  `currena-api.sedanama-ir.workers.dev` and `currena.ir` (kv ok) ·
  `/api/rates?source=tgju` a fresh snapshot (fetchedAt 16:06:19Z — the
  ever-green cron) · parity 100 USD → 27,050,000 IRR @ 270,500 · the
  smoke set green (AED→EUR correctly rejected on the unsupported-currency
  path — the 2026-09 smoke's 503 shape now answers 400 JSON; `/admin`
  Worker-first behind its ADMIN_VIEW_SECRET sign-in gate, 401 text/html
  from the Worker, not the SPA shell; robots.txt correct; `/receipt` SPA
  shell 200) · `goldSummary` serving **netScore −2 / headwind / 6 firing
  — exactly the S6 prediction** (the tilt reads −0.24 at its 21.7th
  percentile, mid-range, SILENT; the stamped reading stands unchanged
  under both the 20- and 21-voter tables) · the lazy Insights chunk
  **byte-identical to the local build** (1,136,013 bytes,
  `Insights-ZaWxnIwP.js`) — `breakeven-tilt` ×2 + "Inflation tilt" (EN) +
  «شیب انتظارات تورمی» (fa ×3) serve on currena.ir. The promoted numbers
  ride every rung from the deploy forward.
- **Credential notes, measured:** the "AI WORKERS" token (`cfut_S4S0…`)
  now answers Invalid at verify — not needed: the narrator runs on the
  account-bound `env.AI` binding, no token stored anywhere. The round-5
  token additionally passed the S5-style throwaway KV write probe
  (PUT→GET→DELETE on `probe:round5:*`, all success — Workers KV Storage:
  Edit, the ingest's REST scope). The repo Actions-secret rotation was
  attempted but `/actions/public-key` answers 404 for this GitHub token
  (full scopes shown, admin on the repo — a grant quirk); the secret
  still holds S5's round-4 rotation from 15:19:16 UTC today (verified
  working when it deployed d77e9139), so the 04:20 UTC ingest belt path
  stands — rotation remains owner-side only if the ingest ever fails
  on auth.
- **What remains:** only the scheduled 2026-11-02 04:30 UTC re-check
  (asOf-watch days 2–3 verdict + the grown-corpus refresh with the
  11-01/11-02 archive days, now over the promoted table). Nothing
  credential-blocked remains.

## [2026-10-31j] — Gold Program S6: the D-5 promotion LANDED — the voter table is 21 (breakeven-tilt, inflation lane), all four gated-session gates + the fresh backtest re-run

The owner's "go" opened the session S5's decision log prescribed
(D-5 decided-YES: "we can have 21"). Everything it required, measured:

- **The table:** `GOLD_LANE_VOTERS` = 21 — `{ lane: 'inflation', id:
  'breakeven-tilt', polarity: 1 }` as the last seat, exactly the
  variant S4's B4 measured (level-leg only: the shared evaluator
  carries no 30-day move threshold for the tilt). No threshold, label,
  or lane-word change anywhere else.
- **The pins:** gold-score.test.ts 35 tests (the promoted shape pinned:
  21 voters, 8/3/5/5 lanes, the tilt once, the last seat) ·
  breakeven-tilt.test.ts 11 (the promotion pin + the
  phrase-selector-is-not-the-voter-lean pin) ·
  gold-backtest-core.test.ts 29 (the equality pin:
  `HARNESS_GOLD_VOTERS_21` = production; `HARNESS_GOLD_VOTERS_20` =
  the S4-frozen table, kept verbatim for lineage, pinned to
  production-minus-the-tilt) · gold-panels.test.tsx 25 (both
  dictionaries cover the 21-voter table exactly).
- **The naming (round-56):** "Inflation tilt" (EN) / «شیب
  انتظارات تورمی» (fa — the compact form of the context card's
  own round-54 name), behind
  `docs/localization/persian-copy-round-56-gold-21st-voter.md`;
  copy:audit clean.
- **The fresh run:** the promoted table over the corpus-of-record
  (the S5 C5 dump, recordedAt 15:17:40Z — the 11-01/11-02 rungs land
  after; the scheduled Nov-2 re-check carries the grown-corpus
  refresh). Sign-agreements 5/20/60td 52.1/47.6/43.9% (baseline
  51.7/46.9/43.9) · the tilt fired 1,174/2,514 (46.7%) · label-bucket
  flips 256 (10.2%) — the B4 delta, now the official lineage. The
  honest nuance, stated in GOLD_BACKTEST_SPEC §5 Session 6: the
  mature-base 5td moves 46.8 → 46.9%, from just-outside to
  just-inside the 2-SE band (its spread flips −0.10 → +0.02%), so
  the S4 "runs the OTHER way" wording softens to "no measurable edge"
  under the same stated-in-advance rule (20td/60td still depart
  below). No edge claim either way; the panel's round-55
  measured-reality note stays the operative description.
- **Live today:** the tilt reads −0.24 at its 21.7th percentile —
  mid-range, SILENT — so the promotion changes nothing about the
  current live reading (the stamped −2/headwind stands under both
  tables); the promoted numbers ride every rung from the S6 deploy.
- **Specs:** GOLD_SCORE_SPEC §2.1 (the 21-voter contract) + §5.1
  (the S6 validation record) · GOLD_BACKTEST_SPEC §5 Session 6 +
  the D-5 decision log closed (IMPLEMENTED) · AGENTS.md §A + NEXT.
- **Bundle budget:** the Insights lazy chunk grew +0.01 kB raw (10
  bytes — the 21st voter's name in both dictionaries + the one table
  entry; measured 1136.01/267.29) — budget bumped 1136.00 → 1136.10
  raw, gz unchanged, justified here per the I7 rule. Entry chunk
  untouched at 294.45/88.48.
- **Deploy:** pending a Cloudflare token in-session (the round-4 token
  lives only in the repo Actions secret; the GitHub side is fully
  unblocked). The moment it lands: `pnpm gates` → deploy-lock check
  → `wrangler deploy` → live-verify, per DEPLOY.md.
- **Landed (postscript):** branch pushed, **PR #10 opened + merged as
  `ca4be2e`** (CI run 368 green — the full gates on the runner, 1m37s
  class); main pulled and verified at the merge tip. The built Insights
  chunk carries the promoted table (EN + fa names + the table entry,
  byte-checked). The deploy + the grown-corpus refresh remain the two
  open items, both waiting on a Cloudflare token (the scheduled
  2026-11-02 04:30 UTC re-check is armed for the corpus side).

## [2026-10-31i] — Gold Program S5: the fourth credential round CLOSED everything — deployed live (d77e9139, the honest note on currena.ir), C5 validated (content-identical), Actions secret rotated

The owner's fourth token ("Try this") verified active and passed the
real tests: a live KV read (16 archive days) and a throwaway
PUT+DELETE probe (Workers KV Storage: Edit). With scope finally in
hand, the runbook ran in order:

- **Gates first:** `pnpm gates` ALL GREEN (10,292 tests · secret scan
  8·686 · layer1 strict 7930/7930 · budget 294.45/88.48 — 1m53s),
  then the deploy-lock check (production at 3bc30ccc since 10-30 —
  no parallel session).
- **DEPLOY:** `wrangler deploy` → **currena-api version
  `d77e9139-c258-49f2-9542-8892c7efa9f2`** (17 new files; RATES KV +
  AI + ASSETS + narrator vars intact). Live-verified end-to-end:
  `/api/health` ok, `goldSummary` serving, and the lazy Insights
  chunk byte-identical to the local build — the round-55 honest note
  (EN + fa) and its backtest link now serve on currena.ir.
- **C5 (validation pass):** `gold-corpus-dump` re-ran read-only
  (0 writes; the same 16 days as S4) and `gold-backtest` reproduced
  every S4 number exactly (2,514 windows; sign-agreements
  51.7/46.9/43.9%; 60td headwind +5.16% vs tailwind +2.19%). The
  only artifact diff is the recordedAt lineage (12:34:24Z →
  15:17:40Z) — the predicted data no-op, now measured. The 11-01 and
  11-02 archive days land with the next rungs; the scheduled Nov-2
  04:30 UTC re-check carries the real refresh + the asOf-watch days
  2–3 verdict (the newest dump already re-shows the constant
  1-trade-date trio offset — no widening).
- **Housekeeping:** the repo Actions secret `CLOUDFLARE_API_TOKEN`
  rotated to the working token (DEPLOY.md §Repairing CI step 4 —
  the KV-Edit scope the ingest's REST writes need). Nothing
  credential-blocked remains; the next owner round is the D-5
  21-voter promotion session.

## [2026-10-31h] — Gold Program S5 post-merge: PR #9 landed (CI green, merge 758298d); the deploy + C5 remain blocked — the third credential round, measured

The owner re-supplied the credential set ("COMMIT MERGE PUSH DEPLOY.
Try once more."). The GitHub token authenticated this time (assadigit,
admin): the S5 branch pushed, PR #9 opened, CI run 364 ran the full
gates green (typecheck, lint, the vitest suite, the SPA build, the
bundle budget, the Persian copy audit — 1m37s), and the merge landed
as 758298d ("merge feat/gold-program-s5-closeout: the Gold Program S5
close-out — the D-5/D-7 verdicts, the round-55 honest note on the
panel, the 2026-11-02 watch re-check, C5 blocked-pending-credential").

- **The Cloudflare pair is unchanged, measured a third time.** The
  "Workers API" token verifies Invalid at /user/tokens/verify; the
  "AI WORKERS" token is active but Workers-AI-scoped — KV REST answers
  `Authentication error`, and `wrangler deploy` (run from the merged
  main with the SPA freshly built) answers `Authentication error
  [code: 10000]` on /workers/services/currena-api. The round-55 honest
  note is therefore MERGED but NOT DEPLOYED; C5 stays blocked (the S4
  corpus stands as the session-of-record; the scheduled 2026-11-02
  re-check carries the refresh). ONE token scoped `Workers KV Storage:
  Read` + `Workers Scripts: Edit` closes the deploy, C5, and the repo
  Actions secret in a single pass. EODHD untouched per D-7.
- **Production untouched and healthy through all of it** (currena.ir
  /api/health ok, KV ok; the insights snapshot fresh at 04:20 UTC via
  the Worker's own minute-cron). The scheduled Actions ingest run
  failed 10:27 UTC inside the documented runner-minutes era — the ci
  runs recovered green from 14:34 UTC, so the next 04:20 UTC rung will
  show whether the belt-and-braces path recovered with them. The
  shiller workflow additionally fails instantly on every push today
  (GitHub lists it by path — a parse-level signature); the source is
  disabled and its archive current, so the site is unaffected.

## [2026-10-31g] — Gold Program S5: the close-out (D-5 decided-YES for its own session, D-7 NO, the honest note on the panel, the watch re-check scheduled)

Session 5 of the Gold Program — the close-out round
(`docs/insights/GOLD_BACKTEST_SPEC.md` §5's Session-5 subsection carries
the full record). No new engines, no new voters, no threshold changes:
three decisions closed, one honest question answered, and the session's
real numbers recorded. All four owner calls landed in one message:
D-5 "we can have 21" · D-7 NO · C4(a) · C5 re-run.

- **D-5 — decided-YES, implementation deferred to its own session.** The
  owner's call on S4's B4 evidence (the tilt fired in 46.7% of 2,514
  windows, moved the label bucket in 10.2%, shifted sign-agreements
  +0.4/+0.7/+0.0pp — no material difference): "we can have 21."
  Promoting `breakeven-tilt` changes score semantics, so it ships in a
  dedicated session with its own gates (the 20→21 pin-test update, the
  21st voter's name in both dictionaries behind a Persian-copy round,
  the harness-local table + its equality pin, the GOLD_SCORE_SPEC
  contract bump). S5 left `GOLD_LANE_VOTERS` untouched — the 20-voter
  pin test stays green.
- **D-7 — decided-NO.** The owner: "No, EODHD api is very limited and
  problematic in free mode." The Yahoo GC=F record + gold-api points
  remain the realized-move venues; nothing fetched, nothing committed,
  the key (if ever revisited) rides env/secrets only.
- **C4(a) — the honest note SHIPPED on the gold tailwind panel.** The
  S4 verdict is now public copy: under the panel's "conditions, not
  advice" footnote, a bilingual measured-reality note
  (`signals.goldScore.measuredNote` + `measuredNoteLink`, EN + fa,
  Persian-copy round-55 —
  `docs/localization/persian-copy-round-55-gold-honest-note.md`;
  copy:audit clean, manifest 4,851 entries) states that over 2016–2026
  the table's lean showed no positive association with gold's next
  5–60 days — if anything, headwind readings came before larger rises —
  "it reads conditions, not direction", with the link word pointing at
  the public backtest report
  (`docs/insights/BACKTEST-GOLD.md` in the public repository — the same
  surface the About section already links for contact). Two new render
  tests in `gold-panels.test.tsx` (25 total). No engine, voter-table,
  threshold, or label change.
- **The asOf-watch — days 2–3 scheduled, not yet observable.** The
  session ran ~13:35–15:00 UTC, before the 11-01/11-02 rungs; day 1
  was re-confirmed from the archive pair itself (10-30 → 10-31: the
  trio 10-28 → 10-29, us10y 5.05 → 4.98, all `warning`, while the
  decade group moved 10-29 → 10-30 — same rung, lag zero). An automated
  one-shot re-check is scheduled for 2026-11-02 ~04:30 UTC; its verdict
  goes to GOLD_BACKTEST_SPEC.md §5 (lockstep → validated-by-watch, still
  not "proven"; divergence → escalate to the owner with the measured
  days — the cross-fill never silently extends to the trio).
- **C5 — blocked-pending-credential (honest).** The read-only KV token
  that authenticated the session-open verification (16 archives listed,
  values read, newest carries `goldSummary` ✓, live API carries
  `goldSummary` + `breakeven-tilt` ✓) was REVOKED mid-session (~14:05
  UTC: every Cloudflare REST call "Invalid API Token"; the second
  provided token is active but KV-unscoped; the GitHub token died in
  the same window). `gold-corpus-dump` was NOT run; the S4 corpus
  (recorded 2026-10-31T12:34Z) stands as the session-of-record until a
  fresh read-only token allows the dump → backtest refresh. The ~14:36
  UTC retry with the re-supplied credentials failed identically
  (Workers-API token revoked; AI-WORKERS token active but KV-denied;
  GitHub token 401 on REST, `Invalid username or token` on push) — and
  a pre-11-01 refresh would be a data no-op (the stage blob was
  written 04:20Z, the 10-31 archive already recorded), so the
  scheduled 2026-11-02 re-check now carries the refresh: one working
  KV-scoped token closes both the watch and C5.
- **Docs:** GOLD_BACKTEST_SPEC.md (the Session-5 record + both decision
  logs), GOLD_FRED_GAPFILL_SPEC.md (the watch's known-gap + D-5), the
  AGENTS.md Gold Program paragraph, this entry. Gates: test / typecheck
  / eslint / copy:audit / gates all green locally (CI stays red
  account-wide, owner-known); the branch → PR → merge → push flow
  carries the same credential blocker as C5 — the ~14:36 UTC retry
  found the re-supplied GitHub token also invalid (401 / `Invalid
  username or token`), so the S5 commit sits complete on the LOCAL
  branch `feat/gold-program-s5-closeout` (re-verified post-retry:
  gold-panels 25/25, gold core + score 61/61, copy:audit + secret scan
  clean), pushed the moment a valid token lands.

## [2026-10-31f] — docs: the consolidated indicator reference corrected (the four missing rows + the counts)

A documentation-accuracy pass over the two files that list the indicator
inventory, prompted by an external audit that compared every doc listing
against `data/indicators.json` (the generated registry — itself unchanged
and correct at 102 ids; no code changes in this round):

- **`docs/INDICATORS_AND_DATA_SOURCES.md` §1 — the four missing inventory
  rows restored**: `au-wage-growth`, `govt-interest-revenue`,
  `us-unemployment`, `usdaed` (all attributes copied from the registry:
  provider, cadence, maxAge, sourceRisk level, publicDisplayOk, voter
  flag). The "complete indicator inventory" table is 98 → 102 rows, now
  matching the 102 `DEFINITIONS` ids exactly.
- **Same file — the counts corrected**: the Counts line said "100 ids /
  Context: 52" (now 102 / 54; the voter arithmetic reads
  9+5+5+3+10 + 5+7+4 = 48); the `/api/insights` endpoint row said "the
  100-indicator snapshot" (now 102); the JSON example said "99 more
  readings" (now 101).
- **Same file — the §1 gauge table re-aligned to the registry groups**:
  the two missing voters restored where they vote (market-stress 4 → 5
  with **cftc-gold-positioning**; growth-health 9 → 10 with
  **oecd-cli-us**); the misattributed context ids moved to their true
  groups (`breakeven-10y`, `platinum` → prices-heat; `shiller-cape`,
  `shiller-ecy` → market-stress; `usdcny` → growth-health); the missing
  context ids added (`au-petrol-yoy`, `rba-cash-rate`, `eia-crude-stocks`,
  `gpr-index`, `michigan-1y-expectations`, `epu-us`, `copper-usd`); the
  voter-total paragraph rewritten accordingly.
- **`AGENTS.md`**: the inventory section's sourcing note still said
  "(the 100 indicators)" — corrected to "(the 102 indicators)". The §A
  listing itself was already correct (102/102, 0 attribute errors) and
  is untouched.

## [2026-10-31e] — Gold Program S4: the backtest harness (B1–B4 — the measured D-5 evidence, and the honest no-edge verdict)

Session 4 of the Gold Program, implementing
`docs/insights/GOLD_BACKTEST_SPEC.md` (its §5 validation record is filled
with the session's measured numbers). The first test of the ENGINE'S
HYPOTHESIS — that the 20-voter table's net direction relates to where gold
actually goes — not just its mechanism:

- **The corpus recorder** — `scripts/gold-corpus-dump.ts`
  (`pnpm --filter @currena/insights gold-corpus-dump`): a read-only KV
  REST dump of exactly what the harness needs — the stage blob's series
  for the 20 voters + breakeven-tilt + gold-usd + the D-6 cross-fill legs
  (us10y = DGS10, breakeven-10y = T10YIE, t5yie), the verbatim
  `insights:hist:gold-usd` realized-move series, and the 16 archived days'
  readings (each zod-validated with the production
  `InsightsSnapshotSchema` before extraction). Recorded to
  `fixtures/gold-backtest-corpus.json` (688 KB, committed static evidence —
  the fixtures discipline; credentials from the environment only, never
  recorded). Zero KV writes.
- **The pure core** — `src/gold-backtest-core.ts` + 28 tests
  (`src/gold-backtest-core.test.ts`): the harness-local parameterized copy
  of the score arithmetic (`scoreOverVoters`) **pinned deep-equal to the
  production `goldTailwindScore`** on synthetic batteries; the
  tilt-augmented `HARNESS_GOLD_VOTERS_21` (the frozen 20 + breakeven-tilt
  in the inflation lane, polarity +1 — production's `GOLD_LANE_VOTERS`
  untouched, the 20-voter pin test stays green); the no-lookahead
  truncation (`seriesUpTo`, with truncated-vs-full equality and a
  future-spike mutation test over `computeReading`); the exact
  N-observation forward-return join; the flat band (the engine's own
  ±2%/30-day `GOLD_REALITY_SPEED_PCT` bar, linearly scaled to each
  horizon's calendar length — ±0.47% / ±1.87% / ±5.60%); the bucket folds
  and the sign-agreement rule.
- **The harness** — `scripts/gold-backtest.ts`
  (`gold-backtest`): re-runs the FROZEN table at a frozen clock over
  **2,514 windows** (every gold trading day 2016-11-02 → 2026-10-31; no
  wall-clock reads anywhere), applies the D-6 cross-fill to the real-yield
  scoring input exactly as in production (**0 fills across all windows** —
  the dense stored series, the S3 audit's expectation, counted aloud),
  joins 5/20/60-trading-day forward returns, re-scores the 16 archive days
  from the readings the rungs actually stamped (the live out-of-sample
  slice), evaluates the 21-voter variant, and writes
  `docs/insights/BACKTEST-GOLD.md` (BACKTEST.md's format; every cell
  carries n; all 9+ confusion cells per table reported).
- **The honest findings** (all measured, none narrated — the conclusion
  follows a stated-in-advance rule: 2-SE binomial departure + sign-
  consistent spread, direction stated): over the stored-history corpus
  the table's net direction shows **no edge in its own direction — the
  measurable association runs the OTHER way at the longer horizons**.
  Mature-base sign-agreements (≥ 2021-09-23): 46.8% / 42.5% / 32.7% at
  5/20/60td, each departing BELOW the 50% coin; headwind labels preceded
  LARGER forward rises (the 60td tailwind−headwind mean spread is
  −3.09%: headwind windows +5.94% vs tailwind +2.85%). This decade's gold
  advance ran through tight real rates and a strong dollar — the
  classical headwinds — so the conditions-reading table reads against the
  move it lived through; the panel's "conditions, not advice" caption is
  the operative description. **B4 (D-5's evidence):** the tilt fires in
  46.7% of windows, moves the label bucket in 10.2%, and shifts the
  sign-agreements by +0.4/+0.7/+0.0pp — **no material difference**; the
  promotion remains the owner's call. The archive era (16 days, 11
  joinable at 5td, 0 at 20/60td) is plumbing, not power — stated.
- **The asOf-watch (§0's first action):** the corpus verified live
  (`goldSummary` + `breakeven-tilt` present; 16 archive days; the newest
  carries goldSummary); day 1 of the trio watch stands in lockstep (both
  the trio and the decade group +1 trading day at the same rung), **days
  2–3 are not yet observable** — the corpus ends 2026-10-31 at the S4 run
  time; the watch carries forward (spec §5).
- **The docs chain** — `GOLD_BACKTEST_SPEC.md` §5 filled + the decision
  log's D-5 entry updated (evidence delivered, the owner's call) ·
  `BACKTEST-GOLD.md` (the report) · `AGENTS.md` §A's Gold Program
  paragraph updated to the S4 state · the fixtures README's corpus row ·
  this entry. No production code touched (script-side + docs + one new
  pure module with its tests); no voter-table changes; no new upstream
  sources (D-7 stays NO — the EODHD key never touched disk); no bundle
  changes; no archive pruning (D-8).
- **Validation** — `corepack pnpm -r test` green (insights gains the 28
  harness tests) · `corepack pnpm -r typecheck` 6/6 · eslint clean on
  every touched file · `pnpm copy:audit` clean (no copy moved) ·
  `corepack pnpm gates` green (secret scan clean). CI stays red
  account-wide (the GHA-minutes exhaustion, owner-known).



## [2026-10-31d] — Gold Program S3: the FRED gap-fillers (the real-yield audit + the bounded cross-fill + the trio split + breakeven-tilt)

Session 3 of the Gold Program, implementing
`docs/insights/GOLD_FRED_GAPFILL_SPEC.md` (its §5 validation record + the
decision log are filled in with the session's measured numbers). The audit
ran FIRST and reshaped the round honestly:

- **G1a — the audit (numbers, not vibes)** — the last 10 years of the
  stored stage series: DFII10 carries **zero holes** vs DGS10 (identical
  2,524-day date sets) and `DGS10 − T10YIE` equals DFII10 **exactly**
  (max |err| 0.0000 pts on all common days — FRED derives the series
  that way). The hole problem does not exist inside the decade window;
  the fill's healthy-day count is 0 BY EVIDENCE. The trio-freshness
  audit: the full-history trio lagged the decade group on **10 of 10
  archived days** (1–3 days) with every FRED group `ok=True` — a
  source-side answer-path lag, not a fetch failure (the 2026-10-22
  archive even shows the trio `stale` ×3, muting 3 of the gold engine's
  20 voters for a day).
- **G1b — the bounded cross-fill (D-6)** — `real-yield-fill.ts` (pure):
  fills the real-yield-10y SCORING INPUT ONLY from `DGS10 − T10YIE` on
  exact-date leg joins inside the decade window (2003-01-02 floor, 4dp
  quantization, 5%-of-window cap → degraded, no fill). The stored
  history, the stage, the peaks and highest-since keep the PURE DFII10
  series; the ingest report counts `realYieldFill: N` aloud every run.
  10 tests.
- **G1d — the trio split (D-4: split, not retry — the audit killed the
  retry default)** — `FRED_BULK_GROUPS` now seven: DGS10/DGS30 keep the
  no-cosd full history (highest-since needs pre-2003) while DFII10 rides
  its OWN `cosd=2003-01-02` request (its whole history, on the
  fresh-at-rung-time negotiated-window answer path). One extra
  subrequest (~49/50). `collect.ts`'s Treasury/EIA fallback triggers
  moved from group ordinals to CONTENT-BASED slot checks.
- **G2 — breakeven-tilt (D-5: context only)** — the derived context card
  `breakeven-tilt` = `T5YIFR − T5YIE` (zero new fetches; both legs
  already ride the decade group), registered [C]/L2 with the legs'
  licence walk, full EN + fa card copy + Layer-1 entries, and the gold
  panel's inflation lane gains its context phrase
  (`breakevenTiltLean`: building/fading/steady with a ±0.1pt deadband,
  copy-keyed both locales — Persian-copy round-54,
  `docs/localization/persian-copy-round-54-breakeven-tilt.md`, 30
  entries, manifest 4,849). The 20-voter table is UNCHANGED — pinned by
  test.
- **The full maintenance chain** — core `IndicatorIdSchema` (102 ids) ·
  the definition (P2, prices-heat, daily/info) · T-10's points-kind set ·
  `UPSTREAM_LEGS` + the derived source line · display config (points,
  2dp) · the Layer-1 inventory (102 indicators + boards = 135) · the
  registry regenerated (`pnpm registry:generate` → 102) · the narrator
  vocabulary regenerated (131 indicators) · AGENTS.md §A + the
  INDICATORS_AND_DATA_SOURCES.md §1/§2 inventory tables (also fixes the
  usdaed row missing from both since 2026-10-29).
- **Validation** — `pnpm -r test` 10,262 passed (0 failed) · typecheck
  6/6 · lint clean on every touched file · `copy:audit` clean ·
  `pnpm gates` green (secret scan, narrator vocab sync, Layer-1 strict,
  build + bundle budget). The `goldSummary` field's absence at session
  start was diagnosed as the expected pre-rung state (the S2.1 deploy
  landed 35 min after the last sweep build; the 04:10 UTC main rung is
  the first with the field) — confirmed on the wire post-deploy.

## [2026-10-31c] — Gold Program session close: the Session-3 FRED gap-fill spec + the wrap-up verification (docs-only)

The S2/S2.1 ship closed out. Nothing runtime-changing in this commit —
documentation and verification only:

- **Session-3 spec authored** — `docs/insights/GOLD_FRED_GAPFILL_SPEC.md`
  (reconstruction-flagged; the original brief died with the Session-1
  sandbox). Scope: G1 real-yield history depth (the DFII10 hole audit +
  the bounded `DGS10 − T10YIE` cross-fill for scoring-input continuity +
  the trio freshness fix; the 2003 wall accepted by default, GSW
  extension parked as open decision D-3) and G2 breakeven interplay
  (new derived context indicator `breakeven-tilt` = `T5YIFR − T5YIE`,
  zero new fetches, EN + fa copy behind the round-54 audit gate; the
  21st-voter promotion parked as D-5).
- **Deploy verification at close** — currena.ir serves the S2.1 build
  from `main` @ `53b2215` (entry `index-5xHey672.js`, Insights chunk
  `Insights-_VabTYqd.js`, both HTTP 200); the served snapshot at close
  was still `2026-10-30T20:10Z` (pre-field) — the stored `goldSummary`
  lands at the 04:10 UTC rung (~4.5 h later), panels derive
  client-side meanwhile (the designed pre-field path, verified in S2.1).
- **Known, recorded** — the full-history FRED trio (`DGS10`/`DGS30`/
  `DFII10`) lagged the decade group by a day at close (asOf 2026-10-28
  vs 2026-10-29) — handed to Session 3 as G1d with live evidence.

## [2026-10-31b] — Insights Gold Program S2.1: the gold panels go bilingual + move under the balance (the owner's two-problem review)

The owner reviewed the deployed S2 panels on currena.ir and named two
problems: "1. they're only latin, while must be bilingual. 2. it's placed
on the wrong section of the site … it must place here: برآیند عوامل مؤثر
بر قیمت طلا" (the gold balance block). This round fixes both — the S5
fa-copy deferral is retired EARLY, behind the Persian-copy audit gate.

- **Bilingual (EN + fa)** — the panels' copy moved OUT of
  `@currena/insights` (`GOLD_PANEL_COPY_EN` / `MODEL_VS_REALITY_COPY_EN`
  RETIRED) into the web i18n dictionaries: `signals.goldScore` (55 keys)
  + `signals.goldModelVsReality` (18 keys) in both `insights-copy-en.ts`
  and `insights-copy-fa.ts`. The Persian follows the terminology glossary
  and reuses the site's fixed vocabulary (فعلاً قابل ارزیابی نیست ·
  متعادل · به نفع/به ضرر طلا · the balance's lane condition names); the
  tailwind/headwind metaphor reads باد موافق/باد مخالف; no em dashes in
  fa (؛ / ، per the glossary); ٪ with fa-IR digits (the PriceDetails
  precedent). Trialed as Persian-copy round-53 —
  `docs/localization/persian-copy-round-53-gold-panels.md`; the audit is
  clean (4,819 entries).
- **Placement** — the panels moved from the prices strip (where S2 had
  mounted them beside the gold-usd tile) INTO the merged gold card
  (`signals/MergedCard.tsx`), DIRECTLY UNDER the BalanceScale visual and
  before the price-footing strip; two columns beside the balance's
  max-width column, stacked on mobile. `PricesBoard` is reverted to the
  four price tiles; `goldSummary` now threads
  `Insights.tsx → Signals.tsx → MergedSignalsCard`.
- **Files** — `signals/GoldTailwindPanel.tsx` + `signals/ModelVsRealityPanel.tsx`
  (moved + restyled as card-inner blocks, `copy` prop, h4 titles);
  `packages/insights/src/gold-score.ts` (pure engine only; the three
  copy-completeness tests moved to the web with the copy — 36 → 33
  tests); `signals/gold-panels.test.tsx` (16 tests: the panel renders,
  the fallback, both dictionaries' coverage, the fa rendering, the
  MergedCard mount order, the prices-strip move-back).
- No data/ingest/API change: the `goldSummary` snapshot field, the ingest
  stamp and the API ride-along are untouched (S2's work).
- **Bundle budget**: the Insights lazy chunk measured 1128.26 kB raw /
  265.32 kB gz vs the 1126/266 budgets → bumped to **1130/267** in
  `scripts/check-bundle-budget.mjs` (the growth IS the reviewed Persian
  copy — the package-level EN constants left with the same move, so the
  EN swap nets ≈ 0). The entry chunk is untouched at 294.45/88.48.

## [2026-10-31] — Insights Gold Program S1+S2: the gold-directional scoring engine + the API/UI wiring (the gold panels ship)

The Gold Program's first two sessions (spec: docs/insights/GOLD_SCORE_SPEC.md):
S1 built the pure engine that re-cuts the EXISTING gauge voters into one
directional score for gold; S2 wired it end-to-end — snapshot field, ingest
stamp, API ride-along, and the two prices-board panels. Zero new fetches,
zero new KV ops, zero new indicator ids, zero new votes; `ruleVersion`
untouched (the engine derives from the unchanged scored readings).

- **`packages/insights/src/gold-score.ts`** (S1) — the pure engine: a
  20-voter / 4-lane polarity table (borrowing costs tight/relief · dollar
  strong/under stress · market stress elevated/calm · inflation hot/cool),
  firing through the shared `evalLeg` lean (30-day direction beyond the
  per-leg threshold, else the decade position); the net score with the
  5-step share-based label (the "strong" bar needs ≥3 firing drivers AND
  ≥50% of them on one side); `modelVsReality` (the score's direction vs
  gold's own 30-day move at the outlook classifier's ±2% bar, with the
  `ma200GapPct` fallback and the six aligned/diverging/neutral/no-read
  chips); `goldSummaryOf` (the compact wire writer); the EN copy blocks
  (`GOLD_PANEL_COPY_EN` / `MODEL_VS_REALITY_COPY_EN` — deliberately in the
  package, NOT the web dictionaries, so the Persian-copy audit stays
  closed until the S5 fa round). 36 tests in `gold-score.test.ts`.
- **`packages/core/src/schemas.ts`** (S2 §4.1) — `GoldSummarySchema` +
  the OPTIONAL `goldSummary` field on `InsightsSnapshotSchema`: additive,
  zero breaking change (every stored snapshot and archive stays valid;
  old readers ignore it). Exported with its leaf schemas. +4 tests.
- **`packages/insights/src/adapters/snapshot.ts`** (S2 §4.2) — the three
  builders stamp/recompute the compact summary beside the section
  summaries: `buildInsightsSnapshot` (the 04:10 main build),
  `patchInsightsSnapshot` (the 04:20 re-derivation phase — the summary
  must describe the readings it ships with) and `projectSnapshotToPublic`
  (recomputed over the surviving readings — the R2 invariant). +4 tests.
- **`GET /api/insights`** (S2 §4.3) — serves the stored snapshot whole,
  so `goldSummary` rides along automatically (no route change; the
  live-prices overlay spreads it through untouched — the spec's §2.4
  documents the honest one-tick skew). The shape example in
  `docs/INDICATORS_AND_DATA_SOURCES.md` §3 gains the block.
- **The web panels** (S2 §4.4) — `GoldTailwindPanel.tsx` (net score,
  label, lane counts, the four lane readings, the firing-driver list
  re-derived client-side through the same pure engine, the
  conditions-not-advice footnote) and `ModelVsRealityPanel.tsx` (the
  chip + the explainer with the reality's own number and basis), mounted
  BESIDE the gold-usd tile on the prices-board strip in
  `PricesBoard.tsx` (further grid items in the same tile anatomy);
  `Insights.tsx` passes `snapshot.goldSummary` down. Old snapshots
  without the field: the panels derive the reading client-side.
  8 tests in `gold-panels.test.tsx` (fixture snapshot with a known
  goldSummary, the label + counts assertions, the fallback derivation,
  the board integration).
- **Docs** — `docs/insights/GOLD_SCORE_SPEC.md` (the full spec: model,
  thresholds, integration points, validation record); `AGENTS.md` §A's
  prices-board note; this entry.

FA copy is deliberately deferred to Session 5 (the Persian-copy audit
gate) — the panels render EN in both locales until the reviewed fa lands.

**Bundle budget (the D-16 path, never silent):** the Insights lazy chunk
grew +3.69 kB raw / +2.30 kB gz (measured 1123.69 kB / 264.30 kB gz) with
the two panels and the engine/copy they import from `@currena/insights`;
the budget bumps 1120/262 → **1126/266** in `scripts/check-bundle-budget.mjs`
(justified: the owner-facing gold score on the prices strip is the Gold
Program's whole point — GOLD_SCORE_SPEC.md §4.4; the entry chunk is
untouched at 294.45/88.48).

Gates: `pnpm gates` ALL GREEN — secret scan clean (8 patterns · 654
files) · typecheck 6 packages · lint 0/0 · copy:audit clean · narrator
vocabulary in sync · narrator eval 50 checks · layer1 strict 7,865/7,865 ·
full suite **10,165 passed** (10,113 baseline + 52 new: insights 884→924,
core 191→195, web 8,587→8,595) · build + bundle budget held after the
justified bump.

## [2026-10-28g] — Insights Layer-2 narrator M4: the generation rung + KV storage + the cached endpoint (DEPLOYED, disabled by default)

Milestone 4 of the narrator build (spec §4 + §9) — the FIRST DEPLOY of
the narrator. Live as worker `2de8f566` with `NARRATOR_ENABLED=false` +
`NARRATOR_VISIBLE=false` + `NARRATOR_WEB_CONTEXT=false`; no
GEMINI_API_KEY on the worker (the owner sets it with
`pnpm narrator:set-key`), so zero model calls are possible — the rung
writes TEMPLATE narratives only, exactly as the spec's "templates only"
deploys demand.

- **`apps/api/src/narrator-cron.ts`** — the hourly :50 rung inside the
  existing minute cron (no new trigger; clear of every other rung).
  Builds the M1 states from the PUBLIC PROJECTION snapshot + the
  markets/fx documents (whatever the site mode, the narrative can never
  name a private-only reading — D-38); stateHash per unit; regenerates
  only changed/older-than-24 h/prompt-version-moved units; ≤3 model
  calls per tick with the pending list carried in the stored doc itself;
  the model→validate→retry-once-with-failed-checks→template ladder;
  part 3 (news) behind NARRATOR_WEB_CONTEXT + the daily cap, omitted on
  any W-check failure.
- **`apps/api/src/narrator-stats.ts`** — the daily buckets (14 days):
  runs, skippedUnchanged, aiValid, aiFailedByCheck (per check),
  apiErrors (per kind, region included), templateUsed, news counters —
  the kill criteria's numbers.
- **`apps/api/src/routes/insights-narrative.ts`** — `GET
  /api/insights/narrative`: the stored doc verbatim, edge-cached
  (`public, max-age=300, s-maxage=600` — visitors cost zero KV reads),
  ungated (public-derived data only), the clean 404 envelope before the
  first rung.
- **Wiring**: the route mounted in the composition root; the rung in
  cron.ts; the Bindings type + `wrangler.jsonc` vars
  (NARRATOR_ENABLED/VISIBLE/WEB_CONTEXT/WEB_DAILY_CAP/MODEL; the KEY is
  a SECRET). Tests: 15 new (the rung's capped batches, the 24 h rule,
  the template/ai/error ladders against a mocked fetch, the flags, the
  endpoint's cache/404/poisoned-KV paths).
- **Free-tier impact (D-38)**: ~120 KV reads + ≤50 writes/day from the
  rung; ZERO visitor reads (edge cache); ZERO external calls without a
  key. The ingest's budget untouched.
- **Deploy + live verification**: deploy-lock re-checked (the versions
  API: last modify 10:16Z = the prep session's deploy; origin/main =
  this session's own M3 push); gates ALL GREEN; deployed; health ok;
  the 404 envelope before the first rung; the insights document
  byte-identical (100 readings, global stressed 9 — zero data changes);
  markets/fx/status 200 unchanged; the first natural :50 rung wrote the
  template document (verified in docs/DEPLOY.md's session record).
- **DECISIONS.md** — D-38 (the M4 implementation decisions + the
  verified budget).

Gates (clean run, `pnpm gates`): secret scan clean (8 patterns · 634
files) · typecheck 6/6 · lint 0/0 · copy:audit clean (4,703) · narrator
vocabulary in sync · narrator eval 50 checks · **layer1 strict
7,809/7,809 unchanged** · full suite **10,018 passed (+15: api
344→359)** · budget held 295.37/88.84 + 1094.09/256.83.

## [2026-10-28f] — Insights Layer-2 narrator M3: the Gemini client + the set-key tool + the offline eval harness

Milestone 3 of the narrator build (spec §5 + §10 + §12): the model
client, the owner-only key path, and the offline evaluation harness. No
key exists in the repo (by design); no Worker code changed; no deploy.

- **`packages/insights/src/narrator/gemini-client.ts`** — the Gemini
  REST client on the CURRENT canonical surface (the Interactions API,
  re-verified in D-28): call type A (schema-constrained `{en, fa}` JSON,
  temperature 0.2, short max tokens, 15 s timeout, ONE retry on
  network/5xx/timeout — never on 4xx) and call type B (the grounded news
  note: plain text, `EN:`/`FA:` block or the single word NONE, the
  url_citation sources + Google's search-suggestions display element
  extracted). Every failure is a typed VALUE (invalid-key · quota ·
  region · http · network · timeout · schema · empty) with redacted
  details — never a throw, never the key/prompts/raw output. The
  response shape is parsed defensively (output_text, the output blocks,
  generateContent-style fallback).
- **`gemini-client.test.ts`** (17 tests) — the mocked-fetch ladder:
  success both call types, the retry rules, region refusal, invalid
  key, quota, schema-invalid/empty, code-fence stripping, the pure
  parsers (both the current and the legacy grounding shapes).
- **`scripts/narrator-set-key.mjs`** (`pnpm narrator:set-key`) — the
  OWNER-ONLY key path: hidden input, refuses argument/env values, warns
  on the non-AIza shape (the OAuth "AQ." confusion), validates with ONE
  minimal call (the models list — zero generation tokens), pipes to
  `wrangler secret put GEMINI_API_KEY` via stdin; wrangler-auth failures
  print the single fix command; success prints "Key saved. Nothing else
  to do."
- **`scripts/narrator-eval.mjs`** (`pnpm narrator:eval`, gate 6): the
  offline eval — 3 prep fixtures re-derived, 7 section/overall fixtures
  through the templates (V1–V10, both languages), the prompt assembly
  (deterministic, no key shape), 4 good mocked model outputs accepted
  and 10 deliberately bad ones rejected by their intended checks
  (invented number/cause, advice, wrong tone, English digits in Farsi,
  missing out-of-date clause; news digits/quotes/no-sources/
  no-attribution). 50 checks, one screen.
- **`scripts/gates.mjs`** — the narrator eval joins as gate 6 (after
  the vocabulary drift check); the secret scan skips the scanner's own
  file (its samples are fake by construction — planted-key detection
  re-verified).
- **DECISIONS.md** — D-34 (the staged-rollout visibility flag: default
  false, `?narrative=preview` before the hash, the one-line flip) +
  D-37 (M3's implementation decisions).

Gates (clean run, `pnpm gates`): secret scan clean (8 patterns · 630
files) · typecheck 6/6 · lint 0/0 · copy:audit clean (4,703) · narrator
vocabulary in sync · **narrator eval 50 checks** · **layer1 strict
7,809/7,809 unchanged** · full suite **10,003 passed (+17)** · budget
held 295.37/88.84 + 1094.09/256.83. No deploy.

## [2026-10-28e] — Insights Layer-2 narrator M2: the four prompts (versioned) + the secret-scan gate

Milestone 2 of the narrator build (spec §6 + §10's secret scan): the
prompt layer and the repo's credential tripwire. No AI calls, no keys,
no Worker code changed, no deploy.

- **`packages/insights/src/narrator/prompt.ts`** — the four prompts,
  `PROMPT_VERSION = 1`: the shared base rules (§6.1, nine hard rules),
  the section task (§6.2), the overall task (§6.3) and the standalone
  news-context prompt (§6.4, call type B — no base rules: that call may
  see the internet). All texts VERBATIM from the spec. The user-message
  builder (`buildNarratorUserMessage`): `SCOPE` / `STATE` /
  `VOCABULARY` / `GLOSSARY` — four labelled lines, deterministic, the
  SCOPE line naming the section + its labels both languages (the news
  prompt's SECTION input rides the same shape).
- **`prompt.test.ts`** — snapshot tests pinning every prompt text
  (drift = failure; any change must bump PROMPT_VERSION), plus the
  user-message shape/round-trip/determinism and a no-secrets assertion.
- **`scripts/secret-scan.mjs`** — the credential tripwire (D-33): 8
  patterns (Google `AIza…`, GitHub PATs, OpenAI `sk-…`, AWS `AKIA…`,
  Slack, the EODHD `hex.hex` shape, generic credential assignments)
  over every tracked text file + the `.dev.vars`/`.env` ignore check +
  an in-memory `--self-test` (9 positives + 8 negatives; no fake-key
  fixture file exists, by design). Findings are redacted (file:line +
  pattern + first 6 chars). Verified by planting a realistic key: the
  scan fails with the exact location.
- **`scripts/gates.mjs`** — the secret scan is GATE 0, before typecheck:
  a leaked key fails the build before anything else runs.
- **`docs/DEPLOY.md`** — "The Gemini key" section (spec §10): create the
  key in AI Studio inside a project WITHOUT billing (the free tier's
  spend limit is N/A — an unbilled project can never be charged),
  never paste it anywhere, rotate immediately if it ever was; the
  free-tier terms note (inputs used to improve products on the free
  tier; the narrator submits only public market data).
- **DECISIONS.md** — D-33 (the secret scan's design + the planted-key
  verification).

Gates (clean run, `pnpm gates`): secret scan clean (8 patterns · 629
files) · typecheck 6/6 · lint 0/0 · copy:audit clean (4,703) · narrator
vocabulary in sync · **layer1 strict 7,809/7,809 unchanged** · full
suite **9,986 passed (+13: insights 825→838)** · budget held
295.37/88.84 + 1094.09/256.83. No deploy.

## [2026-10-28d] — Insights Layer-2 narrator M1: the pure foundation (section states + template fallback + V1–V10/W1–W10 validators)

Milestone 1 of the 5-milestone narrator build
(`docs/insights/layer2/INSIGHTS-L2-NARRATOR-SPEC.md`): the pure, tested,
zero-AI foundation every later milestone rides on. No model calls, no
keys, no Worker code changed, no deploy.

- **`packages/insights/src/narrator/section-state.ts`** —
  `buildSectionNarrationState(snapshot, sectionId, now)`: one section's
  narration state for the four narrated sections (global, australia,
  world-markets, world-currencies — D-32; the prices-board group rides
  global). Every verdict/signal/tier is the document's own computed
  value verbatim; stale/unavailable items land in `excluded`, never in
  the facts; the fx dollar measure rides as the `dollar-basket` item.
  Plus `stateHashOf` (spec §4): a pure sha256 over the stable
  serialization (run clock + age hours stripped) so the generation cycle
  regenerates only changed units.
- **`packages/insights/src/narrator/overall-state.ts`** —
  `buildOverallNarrationState(snapshot, now)`: the whole-page state
  (all four verdicts with counts, every firing alert across sections
  tagged with its section, the currencies patterns, the exclusions
  union). The AI never reads AI output: the overall narrative generates
  from this state, never from section texts.
- **`packages/insights/src/narrator/validate.ts`** — the deterministic
  validators: `validateStateNarrative` (V1–V10) and `validateNewsNote`
  (W1–W10). V3's allowed numbers derive from the unit's own state +
  provided vocabulary; V5 carries the state-verbatim exemption (the
  page's own status words); V7 rejects names outside the unit's state;
  V8 checks tone against the verdict; V10 tracks the out-of-date clause.
- **`packages/insights/src/narrator/template.ts`** — the deterministic
  template fallback (spec §8): 3–5 sentences per section, exactly 4 for
  the overall, EN + FA (Persian digits, half-spaces, no em dash). Passes
  V1–V10 for every fixture in both languages — pinned by tests.
- **`packages/insights/src/narrator/wordlists.ts`** — the Layer-1 word
  canon (JARGON, banned lists, G5 patterns, tenor tokens) moved VERBATIM
  from `layer1.test.ts` (which now imports it — one source of truth; the
  strict validator's 7,809-test count unchanged, verified) plus the
  narrator's own seed lists (predictions, tone words, attribution
  phrases, out-of-date markers).
- **`packages/insights/src/narrator/hash.ts`** — a pure, FIPS-vector-
  pinned sha256 (AGENTS.md rule 2 forbids node:crypto in packages).
- **`packages/insights/src/narrator/vocabulary.ts` + the generator** —
  the generated snapshot gains a `sections` block (the four section
  labels + the approved verdict/signal/market-status words, both
  languages, from existing UI strings; en↔fa parity enforced;
  drift-gated). Regenerated; the web app remains untouched.
- **Golden fixtures** — `packages/insights/fixtures/narration/sections/`:
  global-live, australia-live, australia-calm, australia-excluded (the
  prep fixtures' inputs reused), world-markets-live,
  world-currencies-live, overall-live (captured LIVE from currena.ir on
  2026-10-28: the real attention day — 6 corrections + 1 bear market;
  the r6 warning + the EUR/CHF unusual move). Builder script committed.
- **`docs/insights/layer2/SECTION-STATE.md`** — the contract, field by
  field. **DECISIONS.md** — D-28..D-32 (the four research items
  RE-VERIFIED in the official docs: the Interactions API +
  `gemini-3.5-flash-lite` as the model default; grounding's CHANGED
  response shape + 1,500 RPD free / 5,000 searches-month → part 3 ships
  DISABLED; CF limits corrected — cron triggers are per ACCOUNT, cron
  wall duration 15 min, KV ops/invocation row noted; region risk +
  template-fallback default) + D-36 (M1's implementation calls).
- Copy manifest +156 triaged entries (the template's fa copy + the
  word-list phrases) — audit clean (4,703).

Gates (clean run, `pnpm gates`): typecheck 6/6 · lint 0/0 · copy:audit
clean (manifest 4,703, +156 triaged) · narrator vocabulary in sync
(129×2 + 23×2) · **layer1 strict 7,809/7,809 unchanged** · full suite
**9,973 passed (+98: insights 727→825)** · build + budget held — entry
295.37/88.84, Insights lazy 1094.09/256.83 (byte-identical to the prep
record; the web bundle is untouched). No deploy (no Worker code
changed).

## [2026-10-28c] — Insights Layer-2 narrator: spec + research starter + reserved decisions (session 0 of N; the build itself starts in the next session)

The planning session for the Layer-2 AI narrator
(`docs/insights/layer2/INSIGHTS-L2-NARRATOR-SPEC.md`). Saves the spec
into the repo as ground truth; pre-records the four research findings
the spec requires (Gemini model + free-tier limits, Google Search
grounding terms, Cloudflare Worker limits, region risk) in
`docs/insights/layer2/RESEARCH-STARTER.md` for the next session to
re-verify in the official docs; reserves decision numbers D-28..D-36
in `docs/insights/layer2/DECISIONS.md` with the conservative plans;
defines a 5-milestone split (each independently shippable; each ends
with commit + push so a stopped session never loses more than one
milestone of work); writes the continuation prompt at
`docs/insights/layer2/SESSION-STARTER.md` for the next autonomous
session. No AI calls; no model keys stored; no Worker code changed;
no deploy.

- `docs/insights/layer2/INSIGHTS-L2-NARRATOR-SPEC.md` — the spec,
  moved from the repo root per the task instructions (166 lines).
- `docs/insights/layer2/RESEARCH-STARTER.md` — the four research
  findings (Gemini 3.1 Flash-Lite / 3.8 Flash as the likely default
  `NARRATOR_MODEL`; ~1500 RPD / ~15 RPM free-tier; 5,000 grounded
  searches/month free; CF Worker free plan 50 subrequests/invocation
  + 5 crons/Worker + 100k KV reads/day + 1k KV writes/day; region
  risk + template-fallback default). Each finding marked
  RE-VERIFY-IN-OFFICIAL-DOCS.
- `docs/insights/layer2/DECISIONS.md` — D-28..D-36 reserved with the
  conservative plans (D-28 Gemini model; D-29 grounding terms —
  default SHIP PART 3 DISABLED; D-30 CF limits + cron-rung design;
  D-31 region risk + template-fallback default; D-32 section list =
  4 sections + 1 overall; D-33 secret-scan gate; D-34 staged-rollout
  visibility flag; D-35 kill criteria; D-36+ per-implementation).
- `docs/insights/layer2/SESSION-STARTER.md` — the continuation prompt
  for the next session + the owner notes (the Gemini key the user
  pasted is NOT a standard AIza key; rotate it; create a real one in
  AI Studio with NO billing enabled; enter it via
  `pnpm narrator:set-key` in M3).
- The 5-milestone split:
  - **M1** pure foundation (section state + overall state + template +
    V1–V10 + W1–W10 validators + golden fixtures + SECTION-STATE.md).
    No AI, no deploy.
  - **M2** prompts + secret-scan gate. No AI, no deploy.
  - **M3** Gemini client + `pnpm narrator:set-key` + offline eval
    harness. No deploy.
  - **M4** generation rung + KV storage + the cached endpoint (deploy,
    disabled by default). First deploy.
  - **M5** display + live eval + kill criteria + final report. Final
    deploy.

Gate results (session 0): no code changed; `pnpm gates` unchanged
from the L2 prep final state (LAYER1_STRICT 7809/7809; 9,875 tests;
copy:audit clean; bundle held). Free-tier impact: zero (no Worker code
changed).

## [2026-10-28b] — Insights Layer-2 PREP (P1–P5): freshness, the AU truth, the narrator vocabulary + state contract, `pnpm gates` — no AI, no data changes

The Layer-2 preparation session (docs/insights/layer2/
INSIGHTS-L2-PREP-SPEC.md, moved into the repo under
docs/insights/layer2/): readies the codebase for a future AI narrator
WITHOUT building any AI feature — no model calls, no keys, no prompts.
Zero changes to Layer-1 copy, verdict math, thresholds, alert behaviour,
KV topology or the ingest's request budget. All Layer-1 gate numbers
hold; the strict validator stays at exactly 7,809 assertions.

- **P1 — freshness for every reading**
  (`packages/insights/src/freshness.ts` + 21 tests): the pure
  `freshnessOf(def, asOf, now)` → `{ asOf, ageHours, cadence, freshness
  }` tri-state, keyed on the spec's conservative cadence defaults
  (4/10/45/120 — deliberately equal to the status engine's GRACE_DAYS,
  test-pinned) with each definition's documented `staleAfterDays`
  override imported as the per-indicator refinement (D-20). The AU trio
  is REPORTED at its real served cadence (monthly — the live F2.1
  fallback) while its threshold stays the definition's own 40-day
  override, so freshness and the status engine share one tripwire
  (D-21). Page honesty (spec §3.4): `FreshnessAsOfLine` in
  CardMeta.tsx renders "Data as of {date}" / «آخرین داده: {date}» ONLY
  where a reading's freshness is stale/unavailable AND its card does not
  already say so (status-stale cards flag + age; every card's meta row
  dates its data) — a tested safety net that renders nothing today
  (D-22). One new UI string pair, triaged in the copy manifest
  (round 2026-10-28-l2-prep; audit clean, 4,547 fingerprints).
- **P2 — the Australia data source truth**
  (docs/insights/layer2/AU-DATA-OPTIONS.md + D-26/D-27): the live
  investigation re-verified the venue TODAY — f2-data.csv (the DAILY
  yields) is still Akamai-403 from Cloudflare egress (re-probed via the
  rba-probe worker), but F2.1 monthly + F1 + F1.1 + E2 + F6 + F4.1 + the
  cash-rate HTML page ALL serve (this morning's ingest status blob is
  the evidence), so the trio rides official RBA monthly data that is
  CURRENT (September published 02-Oct), not frozen — Round 10's
  "every rba.gov.au path blocked" claim is corrected with evidence. The
  fix-order walk found no legitimate DAILY alternative (AOFM 520 from
  Worker egress; data.gov.au reachable but no daily AGS yield dataset;
  FRED's AU series is OECD monthly — no granularity gain; ASX L3
  terms-prohibited; Yahoo no AU-10y ticker). Free-tier impact: zero new
  KV operations, zero new external calls. No data-pipeline code changed.
- **P3 — the vocabulary usable from the Worker**
  (`packages/insights/src/narrator/`): the web dictionaries stay the one
  hand-edited source; `pnpm narrator:vocabulary` generates a
  deterministic snapshot (129 indicators + 23 glossary terms × 2
  languages, sha256-stamped, no timestamps) that only the Worker-side
  accessor imports — the web app is untouched exactly as today (D-23).
  `getNarratorVocabulary(ids, lang)` returns ONLY the requested ids'
  compact fields (plainName, oneLine, ifRising, ifFalling, connections
  BETWEEN the requested ids, australiaAngle, glossaryTerms) plus only
  the glossary terms those entries use; en↔fa parity enforced at
  generation time + by 12 tests. Drift gate:
  `pnpm narrator:vocabulary:check` (byte-compare; runs inside pnpm
  gates).
- **P4 — the narration input contract**
  (`packages/insights/src/narrator/state.ts` + 17 tests +
  docs/insights/layer2/NARRATION-STATE.md): the pure
  `buildNarrationState(snapshot, now)` projects the ALREADY-COMPUTED
  page state (summary lines verbatim, alerts with plain magnitudes,
  active fx patterns, per-item freshness, stale/unavailable data under a
  separate `excluded` array, dataAsOf over fresh items — D-24). Three
  golden fixtures pin the contract: a STRESSED day taken from LIVE data
  (2026-10-28), a calm day, and a stale-excluded day — plus
  shape-freeze tests that fail on unnoticed contract changes.
- **P5 — `pnpm gates`** (scripts/gates.mjs): ONE command, seven gates in
  order — typecheck, lint, copy:audit, the narrator-vocabulary drift
  check, `LAYER1_STRICT=1` validator, the full suite, build + bundle
  budget — one-screen summary, non-zero exit on any failure (D-25). The
  5-line owner-side "Repairing CI" note landed in docs/DEPLOY.md.
- Gates: strict validator **7809/7809 unchanged**; typecheck 6/6; lint
  0 errors; copy:audit clean (manifest 4,546 → 4,547, the one new
  string triaged); full suite green with the new tests (core 191,
  scraper 67, insights **727** (+50), markets 13, api 344, web **8533**
  (+8) = **9,875**); bundle budgets HELD without a bump — entry
  295.37/88.84 (unchanged), Insights lazy 1094.09/256.83 vs the
  documented 1100/260 ceiling (+1.53 kB raw / +0.52 kB gz: the
  freshness line + the new copy string). G10 free-tier safety holds.
- DECISIONS D-20…D-27 appended in docs/insights/layer2/DECISIONS.md
  (continuing the Layer-1 numbering).

## [2026-10-29] — Insights Layer 1 (session 4, Milestone 3): markets, currencies and patterns complete — 129/129

Milestone 3 of the Layer-1 plain-language roll-out: the LAST 29 ids get
hand-quality EN+FA plain-language copy, written EN-first from meaning
and Farsi natively. **The Layer-1 roll-out is COMPLETE at 129/129 unique
ids** (133 inventory rows; the 4 shared FX ids counted once, reused by
the FX board). The final session runs `LAYER1_STRICT=1` + the whole
gate list + the owner's deploy-lock check (docs/DEPLOY.md) and deploys.

- **Batch 16** (7): n225, asx200, kospi, hsi, ssec, taiex, nifty50 —
  the Asia-Pacific markets. New shared display hook: the generic
  `layer1/Layer1Block.tsx` (D-17) renders the Layer-1 block in the
  market detail panels (after the approved what/why/you, before the
  chart; direction emphasis = the 3-month change, the section's own
  normal lens).
- **Batch 17** (8): stoxx50, dax, cac, ftse, sp500, ndx, dow, tsx —
  Europe + Americas A. dax lists the existing `leading-indicator`
  glossary term (EN "leading indicator" / FA «شاخص پیشرو»).
- **Batch 18** (7): ibov, eurusd, gbpusd, usdchf, eurjpy, eurchf,
  audcny — the last market + the 6 remaining FX pairs. The
  `Layer1Block` rides the FX pair detail panels too (direction
  emphasis = the 1-month change, the rules' alarm lens). Shared-id
  reuse verified live (the AUD/JPY pair row renders the batch-15
  entry — one entry per id across surfaces, D-11).
- **Batch 19** (7): r1_risk_mood, r2_carry_trade, r3_dollar_strength,
  r4_money_hiding, r5_china_link, r6_europe_worry, r7_dollar_or_euro —
  the pattern cards: ifRising/ifFalling null + skipReason per D-09
  (a pattern is a relationship, not a level); the block renders in
  the cards' Level-2 panel with the "no direction" note.
- No new glossary terms were needed (23 terms in both languages
  unchanged); M3 entries reuse existing entries only: leading-indicator
  (dax), central-bank (eurusd, gbpusd, eurjpy, r6_europe_worry — the
  FA «بانک مرکزی ...» phrase triggers the term), carry-trade (r2).
- Market plain names drop the membership digits in the NEW copy only
  (Nikkei 225 → "Japan's biggest companies" / «نیکی»; D-18) — G6 bans
  digits in new fields and the counts are jargon to the target reader;
  the official names stay on the tiles/tables/panels (approved copy).
- DECISIONS: D-17 (the shared Layer1Block + the per-surface direction
  lens + oneLine/plainName rendering choices), D-18 (digit-free plain
  names) appended.
- Budget: the Insights lazy ceiling bumps 1090/258 → 1100/260 kB (the
  D-16 path; measured at the M3 end 1092.56/256.31 — every pattern
  card also carries a skipReason + 3 connections, and the shared block
  component rides the chunk; entry chunk untouched at 295.37/88.84).
- Gates (every batch + the final clean-state strict run):
  `LAYER1_STRICT=1` layer1 vitest green (7809 tests), full suite
  green (core 191, scraper 67, insights 677, markets 13, api 344, web
  8525), typecheck, lint, copy:audit clean (manifest grown to 4546
  entries, all layer1 round), bundle budget held, render-checked EN+FA
  at 1280/360px on all four surfaces (indicator card, market tile
  detail, FX pair panel, pattern card; screenshots in
  `docs/insights/screenshots/layer1-m3/`). Free-tier safety holds:
  zero KV operations, zero external calls added (G10).
- **Deployed (the final L1 session, 2026-10-28)**: currena-api
  `c02d736a-c0f8-45bf-89bb-f0629ab3ecaf` — the deploy-lock check ran
  first (last prior upload `27f42b9c` at 2026-10-27T18:31Z, the R10
  deploy, predating the M3 pushes; no parallel session), every gate
  re-verified green from a clean state (LAYER1_STRICT=1 7809/7809,
  typecheck, copy:audit clean 4546, budget 1100/260 held at
  1092.56/256.31, lint, full suite 9817 across packages), and
  live-verified on https://currena.ir in BOTH locales at 1280px and
  360px: all four surfaces render the Layer-1 block, zero console
  errors, zero overflow, the 100-reading snapshot untouched, the D-11
  shared ids (USD/JPY, AUD/JPY spot-checked) render one entry per id on
  both surfaces. 17 screenshots in
  `docs/insights/screenshots/layer1-final/`; the full session record in
  `docs/DEPLOY.md`. **Layer 1 is live: 129/129.**

## [2026-10-29] — Insights Layer 1 (session 3, Milestone 2): prices and Australia completed

Milestone 2 of the Layer-1 plain-language roll-out: 44 more indicators get
hand-quality EN+FA plain-language copy (plainName, oneLine, ifRising,
ifFalling, connections, glossaryTerms; australiaAngle per D-08), written
EN-first from meaning and Farsi natively. **Milestone 2 ends at 100/129
unique ids**; the remaining 29 (16 markets + 6 FX pairs + 7 pattern cards)
are M3, then the strict-mode + deploy session.

- **Batch 9** (5): brent, gold-usd, silver-usd, btc-usd, gold-btc — the
  prices-board strip; australiaAngle on brent (fuel imports) and gold-usd
  (AUD conversion), none on the other three per D-08.
- **Batch 10** (8): us-cpi-yoy, us-pce-core-yoy, euro-hicp,
  breakeven-5y5y, us-cpi-core-yoy, us-wages, breakeven-10y, t5yie — the
  inflation half of prices-heat. New glossary term `core-inflation`
  (تورم هسته‌ای).
- **Batch 11** (8): wti, natgas, eia-crude-stocks, platinum,
  gold-oil-ratio, food-index, wheat, maize — prices-heat complete
  (16/16).
- **Batch 12** (6): au-cpi, au-trimmed-mean, au-10y, rba-expectations,
  au-us-10y-gap, au-petrol-yoy — au-inflation-rates complete. New
  glossary term `trimmed-mean` (میانگین برش‌خورده).
- **Batch 13** (6): rba-cash-rate, au-unemployment, au-wage-growth,
  au-rent-yoy, au-home-loan, au-deposit-rate.
- **Batch 14** (5): au-home-values, au-household-debt-arrears,
  au-housing-finance, au-job-vacancies, au-saving-ratio — au-households
  complete (11/11).
- **Batch 15** (6): audusd, audjpy (both shared FX ids — one entry each,
  reused by the FX board), terms-of-trade, rba-fed-gap, gold-aud,
  iron-ore — au-trade-currency complete (6/6), and all 23 AU indicators
  carry australiaAngle (D-08).
- Glossary grows 21 → 23 terms (core-inflation, trimmed-mean, both
  languages). Jargon-null terms written around: no "CPI"/"PCE"/"HICP"
  acronyms in Layer-1 copy, "inventories" → "oil in America's tanks",
  "terms of trade" → "export prices versus import prices" (the FA term
  نسبت مبادله contains the banned نسبت substring; the approved card
  name is used instead).
- Budget: the Insights lazy ceiling bumps 985/236 → 1090/258 kB across
  the session (measured at the M2 end: 1047.65/248.08; the D-16 path —
  bundled static copy, zero KV/external calls; entry chunk untouched at
  295.37/88.85; the M3/final session re-measures the same documented
  way).
- Gates (every batch): layer1 vitest green (6167 tests at the M2 end),
  typecheck, lint, copy:audit clean (manifest grown to 4209 entries, all
  layer1 round), bundle budget held, render-checked EN+FA at 1280/360px
  (screenshots in docs/insights/screenshots/layer1-m2-batch*/).

## [2026-10-28c] — Insights Layer 1 (session 2, Milestone 1): borrowing-costs, dollar-strength, growth-health and market-stress completed

Milestone 1 of the Layer-1 plain-language roll-out
(`docs/insights/layer1/PLAIN-LANGUAGE-SPEC.md`): 23 more indicators get
hand-quality EN+FA plain-language copy (plainName, oneLine, ifRising,
ifFalling, connections, glossaryTerms), written EN-first from meaning and
Farsi natively (Persian digits, ی/ک, half-spaces, the Latin allow-list
only, hedged wording; no advice or certainty words).

- **Batch 2** (7): govt-interest-revenue, us-2y, sofr, mortgage-30y,
  jgb-10y, bund-10y, gilt-10y.
- **Batch 3** (8): euro-aaa-10y, boe-rate, boj-rate, dollar-basket,
  usdjpy, us-japan-10y-gap, eur-usd, usdtry — borrowing-costs and
  dollar-strength are now complete (18/18 and 5/5). First australiaAngle
  entries for the dollar globals (dollar-basket, usdjpy,
  us-japan-10y-gap) per D-08.
- **Batch 4** (8): us-unemployment, sahm-rule, china-pmi, china-cpi,
  copper-gold, michigan-sentiment, initial-jobless-claims, philly-fed.
- **Batch 5** (8): recession-probability, oecd-cli-us, m2-us,
  retail-sales, housing-permits, job-openings, us-gdp-growth, us-nfp.
- **Batch 6** (7): usdcny (shared FX id, + australiaAngle),
  michigan-1y-expectations, cfnai, oecd-cli-cn, oecd-cli-de, epu-us,
  copper-usd — growth-health complete (23/23).
- **Batch 7** (6): stress-stlfsi, nfci, vix, gold-silver,
  cftc-gold-positioning, walcl.
- **Batch 8** (4): crypto-fng, shiller-cape, shiller-ecy, gpr-index —
  market-stress complete (10/10). **Milestone 1 ends at 56/129 unique
  ids**; the four global gauges are done.
- Glossary grows 16 → 21 terms (carry-trade, pmi, vix, money-supply,
  leading-indicator, both languages); the G3 jargon map is extended to
  point PMI/VIX at their glossary terms and to cover carry trade, money
  supply and leading indicator (DECISIONS D-14). Jargon-null terms are
  written around with plain wording everywhere else.
- Bookkeeping (DECISIONS D-13): INVENTORY.md counts reconciled with the
  code (133 table rows → 129 unique Layer-1 entries; the missing us30y
  row added; growth-health 23, au-households 11), a session-1 Farsi
  glossary typo fixed (می‌خرزد → می‌خرد), all re-triaged through the
  Persian-copy audit manifest.
- Budget: the Insights lazy ceiling bumps 940/228 → 985/236 kB across
  the session (measured 978.09/233.68 at the M1 end; the D-16 path —
  bundled static copy, zero KV/external calls; entry chunk untouched at
  295.37/88.84; M2 re-measures and bumps the same documented way).
- Gates (every batch): layer1 vitest green (3338 tests at the M1 end),
  full suite green (packages 677, markets 13, api 344, web 4054),
  typecheck, lint, copy:audit clean (manifest grown to 3643 entries, all
  layer1 round), bundle budget held, render-checked EN+FA at 1280/360px
  (screenshots in docs/insights/screenshots/layer1-m1-batch2/).

## [2026-10-28b] — Insights Layer 1 (batch 1): the plain-language foundation + borrowing-costs copy

The first batch of the Layer-1 plain-language copy work
(`docs/insights/layer1/PLAIN-LANGUAGE-SPEC.md`): fixed, hand-quality
plain-language writing for every indicator on the Insights page, in Farsi
and English, so each card answers "what is this, and what does it mean for
my everyday life?" No AI at runtime — the copy is static, bundled, identical
for every visitor. This batch ships the foundation + 8/134 indicators.

- The two spec files moved into `docs/insights/layer1/` (PLAIN-LANGUAGE-SPEC.md,
  STYLE-GUIDE.md) beside the new DECISIONS / INVENTORY / COPY-REVIEW / README.
- The Layer-1 copy lives as a new top-level `layer1` object on the existing
  `apps/web/src/i18n/insights-copy-{en,fa}.ts` dictionaries (EN source of truth,
  FA shape-checked at compile time — the repo's established pattern, zero
  audit-infrastructure change). Only the NEW Layer-1 fields live here
  (`plainName`, `oneLine`, `ifRising`, `ifFalling`, `connections`,
  `australiaAngle?`, `glossaryTerms`); the approved `whatItIs` / `whyItMatters`
  are reused (decision D-02: approved wording wins). Typed accessors
  `getIndicatorCopy` / `getGlossary` / `getLayer1Ui` live in
  `apps/web/src/components/insights/layer1/` (the contract Layer 2 will import).
- Batch 1: the 8 borrowing-costs indicators (yield-curve-10y2y, -10y3m,
  real-yield-10y, us10y, us30y, fed-target, ecb-dfr, fed-expectations) + a
  16-term seed glossary (inflation, deflation, interest-rate, policy-rate,
  bond, yield, real-yield, yield-curve, breakeven, central-bank, recession,
  volatility, safe-haven, commodity, stock-index, mortgage). EN written first
  from meaning; FA written natively (not translated) in the style of a clear
  Iranian finance explainer.
- The validation gate `apps/web/src/components/insights/layer1/layer1.test.ts`
  enforces G1–G8 (spec §9) on every `pnpm -r test`: completeness (no orphans +
  full-completeness advisory unless `LAYER1_STRICT=1`), length limits, jargon
  must be a listed glossary term, banned advice/certainty words, Farsi hygiene
  (Persian digits/ی-ک/no em-dash/Latin allow-list), no digits except tenor
  names + glossary examples, readability, and en↔fa shape parity. 647 tests.
- Minimal display (spec §6): the collapsed AlertCard shows a tiny muted
  `oneLine` under the meta row (renders only when Layer-1 copy exists —
  graceful during the roll-out); the expanded DetailsPanel adds a `Layer1Block`
  (ifRising / ifFalling with direction emphasis / connections / australiaAngle
  / glossary terms) after the approved F5 sections, plus a `plainName` beside
  the ticker in the header. Existing card hierarchy + wording untouched.
- Gates: typecheck 6/6, web 1363 (+647 Layer-1), cross-package 2655 green,
  lint 0 errors, copy:audit clean (133 fa strings triaged → manifest 2970→3103),
  bundle budget bumped 896/217 → 940/228 (Insights lazy 914.48/221.13; the D-16
  bilingual-content path), browser-verified EN+FA @ 1280+360 (5 screenshots
  under `docs/insights/screenshots/layer1-2026-10-28/`). Free-tier safety holds:
  Layer 1 adds zero KV operations and zero external calls. NOT deployed — the
  roll-out is incomplete (8/134); the final session sets `LAYER1_STRICT=1`,
  fills the last batch until green, then deploys per `docs/DEPLOY.md`.

## [2026-10-28] — Round 10: Insights maintenance + de-risking (RBA regression-pinned, STLFSI fixed, companies table pre-built, visual fixtures restored, lint 0/0, token rotated)

Six items — three maintenance fixes, one de-risking pre-build, one
pipeline restore, one lint/security hygiene pass. The full per-item
log, the live-verification evidence and the Assumptions in
`docs/insights/ROUND10_REPORT.md`. Deployed as currena-api
`27f42b9c-4f26-400f-a5b8-78a4a9c028d3` (+ currena-markets
`bae856ea` for the shared `packages/insights` companies config); the
deploy-lock check ran first (last upload 2026-10-27T04:06Z, no
parallel session). Baseline 1975/1975 tests → 2008/2008 (+33); lint
0/15 → 0/0; copy:audit clean (2970 entries, +10 fa strings); selfcheck
ALL TESTS PASS (25/25, 6 live probes OK); bundle budget held
(896/217 ceiling).

- **R10-1** — the RBA scrape path's parser is verified correct against
  the CURRENT cash-rate page shape (venue-verified 2026-10-27 via
  WebFetch: header "Effective Date | Change% points | Cash rate target
  % | Related Documents", latest row 30 Sep 2026 +0.25 → 4.60). The
  production defect (au-10y, rba-expectations, au-us-10y-gap stale at
  2026-09-30) is venue-level: the Cloudflare Worker's egress is now
  Akamai-blocked on every rba.gov.au path (CSV + HTML), 6 days after
  the R9 venue-verified baseline. Six regression tests pin the current
  page shape against a saved fixture (`rba-cash-rate-page.html`); the
  GHA workflow_dispatch was triggered (different egress, NOT
  Akamai-blocked) but failed at runner allocation (the account's free
  GHA minutes remain exhausted since 2026-10-20). The three readings
  refresh automatically the moment Akamai relents or the GHA minutes
  reset.
- **R10-2** — `stress-stlfsi`'s false-positive stale flag is fixed.
  Root cause: FRED STLFSI4's last obs is 2026-10-16 (the 2026-10-23
  weekly release was missed upstream — all 9 sibling daily series in
  the same FRED bulk group are fresh); the 10-day weekly default
  flagged the 11-day-old reading stale, while NFCI (same date, same
  bulk group) showed normal because of its `staleAfterDays: 14`
  override. Added `staleAfterDays: 14` to stress-stlfsi (matching
  NFCI's precedent); +1 behavioral test pinning the 14-day window;
  `data/indicators.json` regenerated. The live reading flips from
  stale to normal on the next ingest rung (20:10 UTC sweep).
- **R10-3** — the global companies table is pre-built behind a feature
  flag (OFF by default). The owner's R9-09 directive was blocked on
  the EODHD free-plan quota (20 calls/day); R10-3 ships the table
  PRE-BUILT so the flip is a one-line change when the owner upgrades.
  New `packages/insights/src/companies/` module: ~50 world-leading
  companies (Nvidia, Microsoft, Apple, SAP, ASML, LVMH, Toyota, Sony,
  Samsung, TSMC, Tencent, ICBC, Reliance, BHP, Vale, …), a zod
  contract for EODHD `/api/eod/{symbol}` responses, a pure parser +
  deriveCompanyReading helper, a fetch stub (zero live calls while the
  flag is off — no cron rung wired), 19 unit tests against 2 fixtures.
  New `CompaniesTable.tsx` with an empty-state panel (the flag is
  OFF), bilingual EN+FA copy (10 new fa strings triaged), RTL-safe
  layout, responsive desktop-table + mobile-card-list. The flip
  procedure is documented in
  `apps/web/src/components/insights/config/companies.ts`.
- **R10-4** — the visual fixture pipeline is restored. Added all 47
  missing row specs to `apps/web/visual/build-fixtures.ts` (the
  post-M4..M8 indicator ids the builder bailed on since before R9).
  The builder now produces 100 readings (normal:48, warning:7,
  context:40, check-pending:1, stale:2, unavailable:1, no-history:1),
  7 calendar events, 16 market rows, 7 history series, 1 low-readable
  variant. The existing specs are untouched.
- **R10-5** — lint cleanup: 15 warnings → 0 (0 errors / 0 warnings).
  12 `react-hooks/set-state-in-effect` warnings resolved with targeted
  eslint-disable comments (each pattern is a documented React effect
  use: mount-time cache hydration, expand-on-token, reset-to-loading
  on prop change, external-store sync, deep-link URL param, reduced-
  motion animation). 2 `exhaustive-deps` warnings resolved with real
  code fixes: `useDialogFocus.ts` (ref-to-local-var in cleanup),
  `Converter.tsx` (onSubmit held in a ref + layout-effect assignment).
  1 `preserve-manual-memoization` warning resolved: `LiveRateLine.tsx`
  (stable `EMPTY_NUMBER_ARRAY` constant + block eslint-disable for the
  compiler advisory). Full test suite stayed green (2008/2008, +33
  from baseline 1975).
- **R10-6** — Cloudflare token rotation hygiene. The owner's freshly-
  issued `cfut_` token is in service (env-only, never persisted). The
  staged diff was scanned for credential shapes — zero actual
  credential values present (only redacted documentation mentions).
  `OWNER_SETUP.md §10` updated with the fresh-token-in-service
  guidance + the standing owner-action item (revoke the old token,
  update the GitHub repo secret, rotate the GitHub + EODHD keys).

## [2026-10-27] — Round 9: the owner's nine UI changes (merged sections, breadth headline, all-chips balance, US-global-reach brief)

Eight implemented, one blocked on the EODHD quota — the full per-item log,
the live-verification evidence and the Assumptions in
`docs/insights/ROUND9_REPORT.md`. Deployed as currena-api
`babce831-c52e-400e-a410-166d888e1bb5` (+ currena-markets
`fd842cc4` for the shared definitions sync); the deploy-lock check ran
first (last upload 2026-10-27T00:57Z, no parallel session).

- **R9-01** — the "US shares in Australian dollars" box is RETIRED
  entirely (component + lib + the five `usAud*` copy entries in both
  dictionaries + their manifest fingerprints; `copy:audit` stayed clean).
- **R9-02** — the Euro Stoxx 50 and the S&P/TSX wear their OWN logo
  artwork (`stoxx50.jpg` / `tsx.jpg`) in the exchange cards, pinned by a
  new `useExchangeLogo` flag in the market DEFINITIONS (the morning
  round's flag overrides are retired; the world map's country tints are
  untouched).
- **R9-03** — the gold balance shows ALL with/against reasons on the
  balance itself (BalanceScale v8): no capacity, no "+{n} more" pill, no
  separate lists — every chip rests on its pan, the pan grows with its
  stack and the stage reserves the taller stack + the swing (pure sizing
  helpers + measured heights; the v7 beam mechanics kept verbatim).
- **R9-04** — "Is the dollar strong?" is MERGED into the world currencies
  section: the six cards render inside the container under a sub-heading
  with the gauge reading; the standalone lane group is retired
  (`LANE_GROUP_ORDER`). The GAUGES membership is untouched — the hero
  count and every gauge step are unchanged (live: global still 32 voting).
- **R9-05** — the three Australian lane groups render as SUB-headed card
  groups inside the ONE Australia mother container (the section heading
  and the hero's Australia verdict unchanged; the three gauges stay
  separate with their own meters).
- **R9-06** — the markets breadth summary is now a prominent headline box:
  THREE LARGE up/down/flat numbers over a PROPORTIONAL green/red/grey
  breadth bar, under the selected period's own label — first thing after
  the section heading, above the map and tiles, Persian digits in fa.
- **R9-07** — a dedicated "US indicators with global reach" container
  closes the Global section: the nine US-based indicators (plus the
  euro-area mirror) in one card group with an ANALYTICAL BRIEF generated
  from the live values (the consequenceLine discipline — words by
  percentile/status band, values interpolated from the cards' own
  numbers; 14 unit tests; bilingual, manifest-triaged).
- **R9-08** — the balance's empty state renders the FULL evidence-based
  sentence INSIDE the pan (the v6 small pill and the separate card are
  retired; `panEmpty`/`panUnreadable` left the dictionaries).
- **R9-09 — BLOCKED (quota)**: the owner's EODHD plan DOES serve
  stock-level EOD (probed live: AAPL.US, SAP.XETRA return real bars) but
  the free tier's 20-calls/day budget is ~14–18 spent on the markets
  board, and `bulk-last-day` answers with the plan-upgrade page — a
  ~50-company table needs a paid tier (any plan lifting the daily quota
  above ~70 calls or unlocking the Bulk API). Documented in
  ROUND9_REPORT.md with the probe evidence; no half-feature shipped.
- **Gates**: typecheck 6/6 · tests **1975/1975** (web 696→716: the new
  brief + lane-presentation suites, the v8 balance rewrite, −3 retired
  us-shares-aud) · lint 0 errors · copy:audit clean (2960 entries) ·
  selfcheck all-green · **bundle budget bumped 890→896 raw / 215→217 gz**
  with this note (the two new section components + the bilingual brief
  templates outweigh the removed AUD box: measured 892.44/215.72) ·
  live-verified on currena.ir in both locales (zero console errors, zero
  overflow at 360/1280, VLM-inspected screenshots in
  `docs/insights/screenshots-r9/`).
- **Known pre-existing (not this round's doing, recorded honestly)**: the
  visual fixture pipeline (`visual/build-fixtures.ts`) has lacked row
  specs for the 47 M4→M8 ids since before Round 9 — the local + live
  browser verification covered the render gates; restoring the harness is
  recommended as its own work item.

## [2026-10-26c] — the A-1..A-10 gap-audit build: 89 → 100 indicators, 43 → 48 voting

The ten approved additions of `docs/insights/INSIGHTS_DATA_SPEC.md`, all
shipped and live (`78bfc0df`; the full per-item log, budget arithmetic and
Assumptions in `docs/insights/IMPLEMENTATION_REPORT.md`):

- **P1**: the 10y−3m curve leg (T10Y3M on the existing FRED bundle), the
  JGB daily upgrade on the MOF's own CSVs (the 04:20 rung-2 phase's first
  resident; the OECD mirror stays as the labelled outage fallback), the
  US−Japan carry gap (derived, fail-closed, both legs' dates carried) and
  the RBA−Fed policy gap.
- **P2**: the gold/oil ratio (context, percentile-based exactly as the
  spec directs), the keyless EIA crude stocks (Saturday rung) and the
  CFTC gold COT — 49.68% of open interest net long, **needs attention on
  day one** (the crowded-long zone above 45%).
- **P3 (the monthly trio, first-of-month rung)**: the OECD leading
  indicators — one filtered SDMX request for USA + CHN + DEU (the
  dataflow carries no EA19; Germany is the honest euro substitute), the
  US card the growth lane's 48th voter with the OECD's own
  turning-point rule (a new `growth` warning atom: the annualised
  N-month rate); the Geopolitical Risk index (the 2.7 MB legacy .xls
  parsed by the repo's own biff reader — the spec's expected BLOCKED
  never materialised) and the US policy-uncertainty index (the licence
  quoted from inside the workbook itself). A-9/A-10's SD regimes ride a
  new `sd10y` enrichment (the rolling 10-year z-score, recomputed on
  every write — never hardcoded numbers).

**The four defects the build's own verification caught and fixed**:
the OECD parser's jumbled-live-export order (the fixture is
byte-identical to the live file — sort, then assert); the A-6 barrels
display scale (1000× off — caught by the local render before deploy);
the A-7 CFTC stage-accumulation deadlock (the `> 1` stage gate dropped
the first weekly point — the two-Saturday accumulation is now pinned by
test); and the 04:25 daily-history rung's exceededCpu death (zero
writes once the gap-audit ids grew it past the free plan's per-invocation
CPU ceiling — the recorded M1† rung-split at last applied: 04:25 half a
+ 04:27 half b, both halves verified live with every history key then
confirmed in KV). Also: the selfcheck's T-19 (advice wording) — failing
since the M5 round on six pre-existing strings — is green again, and
the inline rung-2 series contract is consumed at last so the
Node/selfcheck builds carry real values for every rung-2 id.

Gates: typecheck 6/6; core 191, scraper 67, insights 644, markets 13,
api 344, web 680 + the recorded 16-failure briefing baseline; lint
0 errors/15 advisories; copy:audit clean (manifest 2958); registry
regenerated (100, 0 hidden); selfcheck ALL-GREEN with live values for
all 100 cards. Budgets: entry 295.28/89.64 kB (raw held); Insights lazy
886.44/214.99 kB (the new documented ceiling 890/215). Serve path
unchanged: one KV read per request. Live-verified on currena.ir EN + fa
(zero console errors; the 89-baseline invariance: zero status changes)
— evidence under `docs/insights/screenshots/a8-a10-2026-10-26/`.

## [2026-10-26b] — the M7 reconciliation: the parallel session, the enriched histories

Two sessions built M7 concurrently (the second D-43-class incident —
caught by the deploy-lock check BEFORE any deploy this time, so no
overwrite happened). The canonical M7 is `6785ec7` (the other session's:
pushed, deployed `0ce6fa8d`, live-verified); this session's parallel
implementation is preserved on a local branch, never pushed. The
reconciliation lands what the parallel work uniquely contributed:

- **The enriched stored histories (already live in KV)**: the RSS-driven
  archive backfill seeded `insights:hist:china-pmi` with **41 months**
  (2023-05 → 2026-09) and `insights:hist:china-cpi` with **30 months**
  (2024-04 → 2026-09) — every value from the NBS's own release pages,
  zero mismatches against the committed seeds on every overlap month.
  The canonical `nbsUnionSeries` consumes them directly: china-pmi's
  10-year position bar renders at the next rung (pct10y=70% at the
  dry-run) instead of after years of monthly growth; china-cpi's joins
  at the November release (29/30 against the floor — honest, not
  padded). T-08 re-verified on the union (trailing runs of 1 — the
  mid-series 2025 -0.1×3 stretch is not a trailing run).
- **The ingest dry-run read-only-store fix**: the dry-run now reads the
  real KV histories when credentials exist (the no-op store misreported
  "stored accumulation empty" and held cards as unavailable — a
  diagnostic that lies is worse than none).
- **The Shiller deadline cleared**: shillerdata.com reachable from this
  venue; the fresh download is hash-identical to the committed file
  (5d176a41, latestDate 2026-10-01) — the committed data IS the
  publisher's latest; only the fetchedAt bookkeeping moved.
- **The era-variant + WZWS knowledge recorded** (the DEPLOY 2026-10-26b
  session record): the pre-2025-07 NBS page phrasings any future
  backfill needs, and the rate-triggered WZWS wall (never seen at the
  ingest's 3-4 fetches/day; 2s pacing fixed it for the one-time archive
  read).
- The CI observation (owner-side): the workflow has failed every push
  since 2026-10-20 (docs-only commits included) while every session's
  local gates ran green — systemic, predates M7, logs no longer
  retrievable; the local-gates discipline stays the honest substitute.

Gates: typecheck 6/6; core 191, scraper 67, insights 582, markets 13,
api 344, web 680 + the recorded briefing baseline; lint 0/15; copy audit
clean; budgets held. No deploy needed (the live `0ce6fa8d` is the M7
implementation; this round's changes are Node-venue script + docs +
data-identical bookkeeping).

## [2026-10-26] — M7: the NBS automation + china-cpi, the BoJ retire

The manual hand-entry era for China data ends, the review's china-cpi ships
on the same automation, and the BoJ fix-or-retire resolves to retire with
fresh evidence (88→89 indicators, voting 42→43).

- **The NBS press-release automation (`adapters/nbs.ts`)**: the English
  PressRelease index scan finds the latest PMI + CPI release links (page 2
  only when a link is missing — the PMI publishes on the 1st, so it sits
  ~15–25 rows back), then each release page fetches once — 3 subrequests
  typical, 4 worst case (~46/50 on the 04:10 shape). The PMI release's
  "Table 1" carries a full 13-month history per fetch (month-end dated,
  the year inferred across the December→January boundary); the CPI release
  carries its own month's YoY (the summary table's Y/Y cell cross-checked
  against the headline sentence — a disagreement beyond 0.05 throws
  FormatChangedError). `china-pmi` leaves the M5 manual-entry regime
  (source `manual`→`nbs`, cadence `manual`→`monthly`): the fetched table
  wins on collisions, the committed seed stays as the fetch-failure
  fallback, and the E-08 manual-expiry bookkeeping leaves the card (the
  45-day monthly grace owns freshness — the Oct PMI would have staled the
  manual file on 2026-10-31). All 10 seed observations re-verified
  identical against the NBS's own Table 1 this session.
- **The licence evidence (the fetch is now granted, not assumed)**: the
  NBS Terms of Service (read 2026-10-26,
  stats.gov.cn/english/nbs/200701/t20070104_59236.html) — "Welcome to
  reprint or quote the contents of this website" with the attribution
  line, and Section III "Use of data" item 1: "You are allowed to
  download and use the statistical data on this website." The register
  row flips (provider `nbs`, method M2, runtime worker) with both quotes
  recorded; the M1 display-permission reading (no prohibition found) is
  superseded by the affirmative grant. The venue probes: all four NBS
  pages answer HTTP 200 from BOTH the sandbox and the Cloudflare
  egress (via the rba-probe worker); data.stats.gov.cn easy-query is
  WAF-blocked (403 UrlACL) and no RSS feed exists — the press releases
  are the only machine-readable path.
- **`china-cpi` — the review's growth-health "China leg"** (SCORED, the
  43rd voter): the year-on-year CPI growth scored against China's own
  published "around 3%" annual target — the us-cpi-yoy/euro-hicp posture
  (the government's own goal line, never an invented threshold). The
  deflation nuance (Sep 2025 read −0.3) lives in the card copy + trend,
  not an unofficial below-zero rule. Seed history: 13 observations (Sep
  2025 −0.3 → Sep 2026 +0.9), each month's value read from THAT month's
  own release page (the provenance table in data/manual/README.md); the
  stored accumulation (`insights:hist:china-cpi`) grows the series
  monthly from here (each CPI release carries only its own month).
- **The BoJ fix-or-retire → RETIRE, with fresh evidence**: the M7 probe
  (both venues, this session) found stat-search.boj.or.jp DEAD from the
  work venue (DNS) AND the Worker venue (HTTP 530 via the rba-probe
  worker) — the machine-readable time-series portal has no path from
  either runtime. www.boj.or.jp itself serves from the Worker venue, but
  the rate decisions live only in PDF releases (k260918a.pdf etc.) — no
  HTML/CSV decision table exists on the current site (the old
  mprf_e.htm Bank-Rate-style table 404s). The OECD mirror's honest
  "monthly average, lagged" relabel stays boj-rate's permanent source;
  recorded in the tracker with the probe evidence.
- **Gates**: typecheck 6/6; core 191, scraper 67, insights 582 (567 +
  15 new nbs-adapter tests), markets 13, api 344, web 680 + the recorded
  16-failure briefing jsdom baseline; lint 0 errors/15 advisories; copy
  audit clean (14 new/changed fa strings processed to
  2026-10-26-m7-nbs, manifest 2821 entries); registry regenerated (89
  indicators, 0 hidden); T-15 public passed (0 hidden); budgets: entry
  295.28/88.81 held, Insights lazy bumped 845/205 → 850/206 (measured
  846.29/205.01 — one card of bilingual content + the china-pmi
  source-honesty reword, the D-16 path). The local dry-run verified the
  full flow live from the sandbox: index page 2 fallback fired (the PMI
  link), the PMI Table-1 parsed 13 months, china-pmi 50.1 normal +
  china-cpi 0.9 normal computed, the growth lane 28 voters. Deployed as
  `366a91de` → `179c3397` (a first temporary 17:45 sweep-list entry —
  honestly SKIPPED by the failure-gate itself: the status was healthy
  and only 7.6h old, the gate working as designed) → `7655b152` (the
  ungated temporary publish rungs — an 18:05 main-shaped run + an 18:07
  periodic-history run, the M4 15:40 pattern) → `0ce6fa8d` (reverted;
  the final state). The 18:05 rung's live capture: 89 readings, all 4
  NBS fetch rows ok from the Worker venue (the index page-2 fallback
  fired), zero genuine failures, the whole snapshot family written in
  18.4 s wall — and the 18:07 rung grew `insights:hist:china-pmi`
  10 → 13 points + wrote `insights:hist:china-cpi` (13 points).

## [2026-10-25] — Wave 3 + the Wave-4 probe fix (M6): the leading edge

Twelve new cards (76→88 indicators), two new scored voters (40→42), the
BoE's own Bank Rate replaces an OECD mirror, and a recovery: the session
that deployed the bulk of this wave overnight (2026-10-25 00:05–00:26 UTC,
Worker versions 211–214) was cut off before committing — this round
recovered its tree from the deployed artifacts and finished the milestone.

- **The recovery (the honest story)**: all 14 API-side files came back
  byte-exact from the deployed Worker's sourcemap (the fac13df precedent);
  the 12 cards' bilingual copy came back from the live Insights chunk
  (the deployed minified dictionaries parsed to source); the display
  configs + four new unit tokens (`aud-bn`, `permits`, `openings`,
  `vacancies`) from the labels chunk. Two latent defects fixed on
  recovery: the scoring.ts `percentileBasis` type mismatch (esbuild never
  typechecks — `'level' | 'yoy'`) and three R14 code-like tickers
  (CFNAI/JOLTS — the deploying session never ran the web gates; they now
  read 'Chicago Fed'/'Open jobs'; HICP joined the CPI/BTC/SOFR universal-
  acronym class).
- **The Wave-3 batch (the review's leading edge)**: `mortgage-30y`
  (MORTGAGE30US, the transmission chain's last stop before the real
  economy), `walcl` (the Fed's balance sheet — the funding/liquidity pair
  with SOFR), `retail-sales` (RSAFS, the consumption pulse), `housing-
  permits` (PERMIT, the classic long-leading), `cfnai` (the composite
  activity gauge — the free ISM substitute), `job-openings` (JOLTS, the
  Powell-era labor leading edge), `t5yie` (the missing middle leg between
  1y Michigan and 5y5y), `us-wages` (AHETPI → 12-month % change, the wage
  leg of the wage-price loop) — all CONTEXT; `euro-hicp` (the NEW
  post-Feb-2026 ECB dataset `HICP/M.U2.N.000000.4D0.ANR` — the old ICP
  flow died 2025-12 upstream; SCORED against the ECB's own 2% target,
  the prices lane's second central-bank goal line), and the AU leading-
  edge trio `au-housing-finance` (LEND_HOUSING, SCORED on YoY growth via
  the C10 rule fix — percentileBasis 'yoy' now honoured by the RULE, not
  just the display), `au-saving-ratio` (ANA_AGG) and `au-job-vacancies`
  (JV) as context. `china-cpi` did NOT ship: BOTH OECD mirrors died
  upstream 2025-04 — the NBS automation carries it as M7.
- **Platinum goes daily**: XPT joins the gold-api spot family (verified
  $1,558 on the probe day); the Pink Sheet monthly stays as the history
  — the cadence inconsistency the review flagged is closed.
- **The Wave-4 probe fix — `boe-rate` on the Bank of England's own
  page**: the Bank-Rate.asp decision table (258 rows back to 1975,
  latest 3.75 since 18 Dec 2025) replaces the FRED OECD monthly mirror
  — the card goes from "monthly average, lagged" to the central bank's
  own current rate at every decision (per-change cadence, the
  rba-cash-rate pattern, expanded to the F1-shaped daily step series).
  Licence: the BoE legal page puts the Database under the **UK Open
  Government Licence v3.0** (quoted 2026-10-25). +1 fetch on the 04:10
  shape (~42/50) with the empirical note that KV ops don't consume the
  fetch-subrequest budget.
- **The probes' honest outcomes**: EODHD au-10y — "not available for
  your subscription plan" (au-10y stays RBA F2.1 monthly); BoJ —
  stat-search.boj.or.jp fails DNS from the work venue (the OECD relabel
  stays boj-rate's stopgap; re-probe from the Worker venue in M7); NBS —
  probed readable and machine-parseable (the china-cpi follow-up).
- **Two quality fixes surfaced by the live state**: the AU quarterly
  staleness recalibration (au-wage-growth had false-staled live on
  2026-10-17 — the WPI's obs-to-release gap is 224d, not 200; the set is
  now wage 230 / home-values 225 / housing-finance 230 / saving-ratio 250
  / vacancies 240, each documented with its cycle arithmetic), and the
  weekend T-03/T-08 metals carve-out (gold-api serves weekend-dated spots
  that legitimately repeat Friday's close — four flags every weekend
  since the seeds began, zero real freezes; the weekday guard is intact
  and tested).
- **The internal archive 2026-10-23 reconstructed**: the D-43
  parallel-session incident left the day's internal twin missing (the
  public twin survived); rebuilt from it — identity that day (0 hidden,
  63 readings), schema-validated before the KV write.
- T-16 re-verified LIVE for all 8 new FRED series (matching the
  deploying session's classes): citation-required — MORTGAGE30US, CFNAI,
  T5YIE; public-domain — WALCL, RSAFS, PERMIT, JTSJOL, AHETPI.
- Gates: typecheck 6/6; core 191, scraper 67, insights 567 (+8 new
  boe/weekend tests), markets 13, api 344, web 680 + the recorded
  16-failure briefing jsdom baseline; lint 0/15 advisories; copy audit
  clean (148 new fa strings processed to 2026-10-25-m6-wave3, manifest
  2808 entries); T-15 public passed (0 hidden); budgets held (entry
  295.28/88.80; Insights lazy 841.84/203.99 vs the bumped 845/205 —
  twelve cards of bilingual content, the D-16 path). Deployed as
  `a4d6ef37` 33 minutes ahead of the 04:10 main rung.

## [2026-10-24b] — Wave 2 (M5): household costs & the euro long end

Five more context cards (71→76 indicators), zero new scored votes (the
gauges stay at 40 voters), and the review's one honest negative RESOLVED.

- **`euro-aaa-10y` — the AAA key the review could not find, verified live
  at build time**: `YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y` ("AAA yield
  curve - 10-year spot rate", the ECB's own daily yield-curve dataset;
  3.38% @ 2026-10-22). The review's four candidate keys all 404'd because
  they probed dotted/FM forms — the slash-form YC key on
  `data-api.ecb.europa.eu` answers 200 (the G_N_C sibling is the
  ALL-rated curve; G_N_A is the AAA one). The decade-window request rides
  one new subrequest (49/50 on the 04:10 shape). The OECD bund mirror
  KEEPS its honest "monthly average, lagged" stopgap label beside the new
  daily card — the fix-or-retire call stays the owner's M6 question.
- **The Pink Sheet unlock — `food-index`, `wheat`, `maize`**: the Food
  index (2010=100, the Monthly Indices sheet, header "Food **" verbatim;
  live 124.1 @ 2026M09 — the top quintile of its decade) plus the two
  staple grains from the same workbook's Monthly Prices sheet (Wheat US
  SRW 278.6 $/mt, Maize 239.6 $/mt). ONE workbook download, two sheet
  reads, zero new requests — the "already downloaded daily, unparsed"
  unlock the review called for. Groceries are the most-felt line of
  household inflation; the energy-vs-food pairing now reads beside
  Brent's scored card.
- **`usdtry` — the EM-pressure first member**: TRY rejoins the one
  Frankfurter request as the ninth leg (zero extra requests); the card
  shows 49.74 — the top of its decade range, the inflation→devaluation
  case study in real time. The fx-module EM block may follow in a later
  round once TRY proves the slot.
- All five are CONTEXT rows (info rules): the borrowing-costs vote stays
  with ecb-dfr/fed-target, prices-heat with CPI/PCE/brent, dollar-strength
  with the basket/JPY pair. New `try` unit token (₺ / «لیر ترکیه»).
  Staleness: euro-aaa 7d (ECB T+1), the Pink Sheet trio 60d (the B-09
  publication cycle).
- Gates: typecheck 6/6 · core 191 · scraper 67 · insights 559 · markets
  13 · api 344 · web 676 + the recorded briefing baseline · lint 0/15 ·
  copy audit clean (64 new fa strings processed to 2026-10-24b-m5-wave2,
  2,660 entries) · T-15 public passed (0 hidden) · budgets: entry held,
  Insights lazy bumped 782/189 → 800/194 (measured 797.18/192.61 — the
  same bilingual-corpus growth, justified in the script). The local
  dry-run verified all five values live end-to-end.

## [2026-10-24] — Wave 1: the early-warning pack (M3+M4 of the D-42 milestones) — and the OD-5 honest no-go

The second Phase-2 round delivers the analytical core the Economist's Review
called for: the dashboard can now **warn**, not only detect. Eight new
indicator cards ship (63→71), the global voting pool grows 22→26, and the
FRED consolidation becomes six bulk groups. The round also carries the
round's one honest negative: the credit-spread cards are excluded by their
publisher's licence — recorded as D-44, never silently absorbed.

### M3 — the credit-spread licence row: the honest no-go (OD-5, D-44)

- **The T-16 scan found the ICE BofA indices are NOT the citation-required
  class OD-5 assumed.** Live reads of the FRED series pages (2026-10-24)
  show `BAMLH0A0HYM2` and `BAMLC0A0CM` carry the
  **"copyright: pre-approval required"** tag — the licence class FRED's
  legal page (read verbatim 2026-10-21) puts behind the *publisher's*
  written permission, which the owner's acceptance cannot grant.
- **The register now fail-closes that class on BOTH gates**: a new
  pre-approval branch in `sources.ts riskRowForLeg` (enabled: no — no
  fetch can be wired) and in `licences.ts fredLicenceForSeries`
  (publicDisplayOk: no — never public), plus the `fred-pre-approval` rows
  in `RISK_REGISTER.md` + `LICENCES.md` and the two scan records in
  `data/fred-copyright.json` carrying the evidence. **No hy-oas / ig-oas
  card ships** until the owner secures ICE's written permission (the
  owner's standing directive — "you can exclude information that are
  private and not available" — covers the exclusion; D-44 records the
  owner's options). A future session cannot wire these series without
  confronting the register.
- The rest of the pack's series landed under the existing rows:
  ICSA / RECPROUSM156N / PCEPILFE are **public-domain** (the fred-public
  row, 14→23 series); SOFR (© NY Fed) and UMCSENT / MICH (© University of
  Michigan) are **citation-required** (the fred-copyright row, 8→16
  series) — display-permitted with the "publisher via FRED" citation per
  the 2026-10-21 legal read.

### M4 — the early-warning pack (OD-8)

- **`initial-jobless-claims`** (FRED ICSA, weekly, P1, scored on its
  10-year high tail like its sibling us-unemployment): the fastest labor
  read there is — weeks before the monthly data, months before Sahm.
  First live value 194,000 (bottom decile of the decade — a tight labor
  market). Displayed with a new `claims` unit token ("194,000 claims" /
  «۱۹۴٬۰۰۰ مورد») because the R13 gate forbids empty unit labels.
- **`recession-probability`** (FRED RECPROUSM156N, monthly, P1, scored at
  the 0.50 line — the classic recession call, mirroring the Sahm rule's
  own threshold): stored as the published fraction, displayed scaled ×100
  ("62%"). First live value **0.62 — warning**: the Marcelle-Chauvet model
  already reads the data as recession-like (up from 0.24 at the review's
  probe three weeks ago).
- **`michigan-sentiment`** (FRED UMCSENT, monthly, P1, scored on its
  10-year low tail) with **`michigan-1y-expectations`** (FRED MICH) riding
  inside it as a companion-only reading (the us-cpi-core-yoy pattern) —
  the review's "carries the 1y expectations leg". First live values:
  sentiment **48.1 — warning** (bottom decile), expectations 4.6%.
- **`us-pce-core-yoy`** (FRED PCEPILFE → the derived 12-month % change,
  monthly, P1, scored against the Fed's own 2% target — the same
  published-goal posture as us-cpi-yoy's 3% line): first live value
  **3.01% — warning**. The Fed's preferred gauge, absent until now.
- **`sofr`** (FRED SOFR, daily, P2, context): the overnight funding leg —
  the "rate set = rate transmitted" check the rates panel was missing
  (policy ✓ → funding ✗ → long end ✓). 3.90%, sitting inside the Fed's
  corridor as it should.
- **`us-2y`** (FRED DGS2, daily, P1, context): the Tier-0 display from
  the already-collected series — the market's policy path made visible;
  the scored vote stays with fed-expectations so the lane never
  double-votes one series. 4.65%.
- **`breakeven-10y`** (FRED T10YIE, daily, P2, context): the 10-year
  breakeven leaves its validation-only role and becomes the near leg of
  the expectations pair beside 5y5y. 2.34%.
- **The FRED consolidation grows to six bulk groups** (~37 series): SOFR
  joins the daily rates/stress group (still one wide CSV), and a new
  Wave-1 group carries ICSA + RECPROUSM156N + UMCSENT + MICH + PCEPILFE
  (mixed weekly/monthly — the ZIP answer path, venue-verified 2026-10-24:
  every id served). The 04:10 main rung's subrequest count: 48/50. The
  history rungs pick up three new daily-cadence ids (sofr, us-2y,
  breakeven-10y → the 04:25 shape at 39) and five periodic ids (→ ~31).
- **Gauge membership**: growth-health 5→8 (claims, recession-probability,
  michigan-sentiment join the voters; china-pmi, philly-fed,
  us-unemployment, sahm-rule, copper-gold stay), prices-heat 3→4 (core
  PCE joins us-cpi-yoy, breakeven-5y5y, brent). sofr / us-2y /
  breakeven-10y / michigan-1y-expectations are context rows — never
  voters (the iron-ore precedent).
- **Staleness discipline**: claims 12d (one missed weekly print),
  recession-probability 100d (the model publishes ~2 months behind),
  us-pce-core-yoy 95d (BEA's ~30d-after-month-end cycle), the Michigan
  pair 75d (the us-unemployment precedent). The sanity ranges gain
  recession-probability's definitional [0, 1] band.

### Gates, copy and budgets

- Typecheck 6/6 · core 191 · scraper 67 · insights 559 · markets 13 ·
  api 344 · web 676 + the recorded 16-failure briefing jsdom baseline ·
  lint 0 errors / 15 advisories (the recorded set).
- The Persian copy manifest processed 92 new fa strings (the eight cards'
  full corpora + the new units.claims word) to round
  `2026-10-24a-m4-wave1`; audit clean at 2,596 entries.
- T-15 public passed (0 hidden ids — the whole pack is display-permitted:
  public-domain or citation-required-with-attribution).
- **Bundle budget bump (documented, per the D-16 path)**: the Insights
  lazy chunk 765.00 → **782.00 kB raw** / 186.00 → **189.00 kB gz** —
  measured 780.48/188.46; the growth is exactly the eight-card bilingual
  copy corpus (+27.22 raw / +6.95 gz over the M2 tree). The entry chunk
  (the money page) is untouched at 295.28/88.80.
- The local dry-run verified all eight values live end-to-end (the
  recession radar now reads: claims normal · unemployment 4.2% · Sahm
  silent · **probability 62% warning** · **Michigan bottom-decile
  warning** · **core PCE 3.01% warning** — three of the four new voters
  warn on day one).

### Live verification + the rule-text scale fix

- Deployed `21d0b040` (the round) → `5924ed4f` (the temporary 15:40 UTC
  publish rung, the M1 pattern — captured, then reverted in `c1b36019`).
  The 15:40 main-shape rung completed every write (stage + snapshot +
  status + archives + public projection at 15:40:18Z — the binary
  signal: the pre-fix exceededCpu failure mode died *before* any write;
  the exact cpuTime capture rides the designed 20:10/04:10 rungs).
- **The live verification found one real defect, fixed in `160ac6e2`:**
  the rule-text renderer (`labels.ts ruleAtomText`) did not apply a
  card's display scale to its THRESHOLD — recession-probability stores
  the published fraction (rule `above 0.5`) but displays scaled ×100,
  so its line read "above 0.5%" instead of "above 50%". The fix passes
  `DISPLAY[id].scale` through `formatRuleText` — the threshold now
  speaks in the reader's units in both locales («بیشتر از ۵۰٪»).
- Browser-verified on currena.ir (evidence under
  `docs/insights/screenshots/m4-2026-10-24/`): the hero reads
  **"7 of 25 indicators need attention"**, the growth gauge
  **Cautious 2-of-8**, the probability card "62% · +38.00 pts · Needs
  attention", Michigan 48.1 warning with its "Expected inflation next
  year: 4.6%" companion, claims "194,000 claims" (details: "Stale after
  12 days", the honest "No chart history for this card yet" until the
  04:25/04:40 history rungs fill from the stage), SOFR 3.90% with the
  "New York Fed via FRED" citation, us-2y 4.65% and breakeven-10y 2.34%
  context, the fa hero «۷ شاخص از ۲۵ شاخص نیازمند توجه‌اند» — zero
  console errors in either locale.

## [2026-10-23] — the Phase-2 open: the unhide round (Shiller pair + china-pmi) and the rung CPU fix (M0+M1 of the D-42 milestones)

The owner approved the review's Wave-0 calls with a sequencing directive
("Do them in phases. add a milestone for each phase." — D-42): OD-1/OD-2
(the unhides), OD-5 (the credit-spread licence row, M3), OD-7 (the
subtraction set, M2) and OD-8 (the five value-ordered waves). This round
delivered M0 (the decision records + `docs/PHASE2_MILESTONES.md`) and M1 —
plus the unplanned M1† the rungs forced.

### M1 — the unhide round

- **The Shiller pair serves publicly** (`shiller-cape` 40.71 ratio /
  `shiller-ecy` 0.56%): the risk-register row flipped owner-accepted +
  enabled (the T-30 flip, mirrored in `RISK_REGISTER.md` + `LICENCES.md`),
  the display gate opened in `licences.ts` (publicDisplayOk yes, terms
  re-read 2026-10-23, attribution "Data: Robert Shiller, Yale"), and the
  ingest reads the committed converted file
  (`data/shiller/shiller-cape.json`) — the ECY fraction is scaled ×100 to
  the registry's percent convention at parse time. Runtime honestly
  recorded as **manual**: the monthly GitHub Action died with the
  account's Actions minutes (2026-10-20); `scripts/shiller-fetch.ts` is
  the documented refresh path. **Open item:** shillerdata.com was
  unreachable from the work venue (the fetch honestly fell back to the
  stale 2023 Yale mirror and was discarded) — the committed file
  (latestDate 2026-10-01) must be refreshed from a reaching venue before
  the 45-day window closes (~2026-11-15).
- **`china-pmi` serves publicly** (50.1, Normal, growth gauge now 6
  members): the NBS English terms pages were read 2026-10-23 — no reuse
  prohibition found for attributed quotation; the manual licence row
  flipped display-ok (D-42/OD-2) with the enteredOn/expiry bookkeeping
  (E-08/T-33) unchanged. The global voting pool went 22→23.
- **The generated projection**: `hiddenIndicatorIds` is now empty (65
  public readings); the audit entries for the three ids match the
  deployed sidecar on all 65 entries after regeneration.

### M1† — the rung CPU fix (exceededCpu at the free plan's ~2 s budget)

The 04:10/10:10 rungs had been dying silently at exactly cpuTime 2050 ms
(captured live via `wrangler tail` on temporary hourly :05 diagnostic
rungs, since reverted with an honest note): the rung builds the snapshot
TWICE — the draft that feeds the validation suite, then the final with
the safety flags — and the deterministic percentile work over 10-year
windows is the CPU that killed it. The fix memoizes the deterministic
per-reading base (`baseReadingCache` in `adapters/snapshot.ts`): the two
builds differ only in `flags`, which applies after the cache point, so
the second build replays instead of recomputing (clone-on-hit keeps each
build's reassignments private). Phase timings surfaced to the run log.
The fixed 16:05 UTC rung completed healthy at cpu 1831 ms with the
snapshot + stage + public projection all written.

### The recovery note (recorded honestly)

The M0+M1 working tree was lost to a sandbox reset before its commit —
the source was reconstructed from the deployed Worker's own sourcemap
(7 files recovered byte-exact) with the licences display flips and test
pins re-derived against the recovered audit; the regenerated registry
matches the deployed audit on all 65 entries. Tests: typecheck 6/6;
insights 557, api 344, web 680 passed (the 16-failure briefing jsdom
baseline unchanged); the two date-conditioned prices-cards pins and the
sweep date-bomb fixed for the new reality (real-clock-relative fixtures).

## [2026-10-23b] — the subtraction set (M2 of the D-42 milestones): nzd-usd + silver-btc retire, m2-us demoted, the five OECD mirrors honestly relabelled

OD-7 executed in full, a few hours after M1 on the same day. Subtraction
discipline before the Wave-1 additions (M4): every item reversible, every
change verified live in both locales.

### The retirements (the eth-usd pattern, twice)

- **`nzd-usd` retired** — an indicator card for an audience that doesn't
  exist (no NZ coverage anywhere on the product; not in the FX module's 10
  pairs). The id left the schema enum, the definitions, the derived
  builder, the upstream-legs map, the display/section configs and both
  copy dictionaries; the Frankfurter request drops its NZD leg again
  (nine currencies → eight, still one fetch).
- **`silver-btc` retired** — the weaker twin of `gold-btc` (the silver
  leg barely moves; the ratio mostly mirrored bitcoin). The id left the
  schema, the definitions, the derived builder, the upstream-legs map,
  the live-ratio sources (prices definitions + merge), the T-13
  cross-check in the validation suite, and both copy dictionaries;
  `BTC_RATIO_IDS` is down to `gold-btc`.
- **The KV surgery (16 writes, 2 deletes, run BEFORE the deploy so the
  page never broke)**: `scripts/retire-ids-migration.ts` strips the two
  readings + their changedThisWeek entries from the live snapshot, the
  public projection, all seven stored daily archives (10-15 … 10-22) and
  their public twins (each day's own hidden-set filtering preserved),
  recomputes both section summaries with the current gauges, validates
  every rewritten doc against the NEW schema, deletes the orphaned
  `hist:nzd-usd`, and re-runs the public projection exactly as the daily
  rung writes it (63 public readings + today's archive-public). The
  migration also sets m2-us's stored reading to `context` so the served
  card and the recomputed 22-voter summary agree until the next rung.
- 65 → **63 indicators**; the registry, audit sidecar and
  site-mode-overrides regenerated (`hiddenIndicatorIds` stays empty).

### The demotion (keep the series, lose the vote)

- **`m2-us` scored → context** — the monetarist framing was overweighted
  as a scored gauge member of a framework the product doesn't otherwise
  run. The rule flipped `yoy-negative` → `info` (status `context`, never
  votes), the growth-health gauge drops to 5 members (china-pmi,
  philly-fed, us-unemployment, sahm-rule, copper-gold — the iron-ore
  precedent), and the card keeps its year-on-year percentile context.
  The global voting pool went **23 → 22**; the regression fixture's
  inflation-2022/m2-us expectation moved to `context` with it.

### The honest relabels (the cheapest honesty fix on the dashboard)

- The five OECD-mirror rows — `bund-10y`, `jgb-10y`, `gilt-10y`,
  `boj-rate`, `boe-rate` — now say what they are in both locales: a
  **monthly average, lagged** ("over the latest full month … so it can
  sit behind the day's traded yield" / "میانگین ماهانهٔ با تأخیر، پس
  ممکن است از بازده معاملات روز عقب بماند"). A month-old policy rate
  shown as current was actively misleading; the daily-source probes
  remain the recorded follow-up (Wave 4 / M6).

### M1†† — the rung CPU margin restored (the second unplanned round, same date)

The 20:10 UTC sweep died `exceededCpu` at exactly **cpuTimeMs 2050** on
`32c47cad` (the M1† cache-fix build) — captured after the fact via the
Workers observability telemetry query (`view: events` carries
`$workers.outcome`/`cpuTimeMs`); a live `wrangler tail` could not survive
the sandbox's process reaping that session. The M1†'s 16:05 success at
1831 ms had left only ~220 ms of headroom and run-to-run CPU variance ate
it; with the RBA cash-rate page newly Akamai-403 from Cloudflare egress
(kind `blocked`), the sweep gate fires on every sweep — the page had been
stale since 16:05 and the heavier 04:10 main shape would have kept dying.

- **Root cause (profiled locally with `node --cpu-prof` on the ingest
  twin)**: `epochDay` was the top self-time function of the whole ingest
  (~0.84 s + GC pressure) — the debug invariant `assertAscending` re-walks
  an entire series (one `Date.parse`+string-concat per point) on EVERY
  `pointAtOrBefore` / `sliceBetween` / `combineSeries` / `yoyPctSeries`
  call, thousands of full O(n) passes over 2,600-point daily series.
- **Fix**: `epochDay` is memoized in `packages/insights/src/series.ts`
  (module-level `Map<string, number>`; the date domain is a few thousand
  distinct ISO strings; values bit-identical to `Date.parse`'s; invalid
  dates still throw every call — nothing caches on the throw path).
  Local phases: draft 0.78 s → 0.12 s, validation 0.13 s → 0.03 s.
- **Verified live**: a temporary 22:35 UTC diagnostic sweep rung (the M1
  pattern — added, captured, reverted with an honest note in
  `insights-ingest-cron.ts`) completed **`outcome: ok` at cpu 617 ms**
  with the snapshot + status + stage + public projection all written.
  Margin restored to ~3.3× under the free-plan ceiling even for the
  heavier main 04:10 shape; the M1† rung-split follow-up is retired as
  unnecessary.

### The parallel-session incident (recorded honestly)

Two sessions were working the same tracker simultaneously this evening.
The M2 session deployed `75517285` (M2, no CPU fix) at 21:55 UTC; the
CPU-margin session — unaware — deployed `b6e1541b` at 22:11 UTC from the
pre-M2 tree plus the epochDay fix, which **overwrote the M2 build** and
briefly re-serving the two retired cards (its 22:35 diagnostic rung wrote
a 65-reading snapshot, re-adding the retired readings to the stored
documents the M2 migration had just cleaned). The reconciliation (this
commit) resets onto the M2 tree, re-applies the epochDay memoization on
top, re-runs the KV surgery for the two documents the 22:35 rung
re-poisoned (the live snapshot + the public projection), and redeploys —
M2 and M1†† land together. The observable window of the overwrite was
~90 minutes (21:55 → the reconciled deploy); the owner's OD-7 approval
made both endpoints of the window approved states, so no unauthorized
content ever served. The tracker's session log records both sessions.

### Gates + verification

Typecheck 6/6; core 191, scraper 67, insights 559 (the two new epochDay
behavior tests on top), markets 13, api 344, web 680 passed + the
recorded 16-failure briefing jsdom baseline; lint 0 errors/15 accepted
advisories; T-15 public passed (0 hidden); budgets held (entry
295.28/88.81 vs 296/89.5; Insights lazy 753.22/181.51 vs 765/186 — the
retirement shrank the chunk). The M2 build was deployed as currena-api
**`75517285`** after its KV surgery and live-verified on currena.ir
EN + fa (hero "5 of 22", the M2 card Context with value + history, both
retired ids 400 on their history routes, the archives serving, the Bund
details panel carrying the relabel in both languages); the reconciled
build (M2 + M1††) deploys after the re-run migration. The copy manifest
— a gate the M2 tree had not closed — is processed in this round (the
relabels + retirements round-tripped through
`update-persian-copy-manifest.mjs`; audit exit 0, 2,504 entries).
EODHD quota untouched (0 requests).

## [2026-10-21c] — the currencies section returns, the licence-hidden cards are restored on verified terms, and the balance/panel round (owner restoration)

The owner's directive: "currena's insight used to have a full currency and
pairs section, which was dedicated and detailed… they're all gone during the
updates and upgrades, please revert and restore that section. but check it
financially and logically. they must make sense, be real, with updated and
real data." — plus four follow-up directives (retire the silver balance,
fix the too-slow gold tilt, replace the count-repeating Australia signals
bullets with real data, retire the weekly-event line, and restore the
"Are markets nervous?" indicators — "only crypto/fear greed is relatable
for this part").

### Why the sections had vanished — and the licence fix

The 2026-10-19 public-mode decree hid 28 indicators + the whole fx board
behind the fail-closed licence gate. Three of the four blocking licence
classes were re-verified TODAY (2026-10-21, each read verbatim in a real
browser — the exact step the old evidence said was pending):

- **ECB** (the Frankfurter FX legs + the DFR rate): the ECB "Disclaimer &
  Copyright" page permits free use of website information when it appears
  accurately, the ECB is cited as the source, modifications are stated
  explicitly, and it is not sold without notice. Currena shows the
  reference rates verbatim with ECB attribution; every derived number
  (the dollar basket, gold-AUD) carries its own stated definition; the
  same rates already power the public converter. → `publicDisplayOk: yes`.
- **World Bank** (copper, platinum, iron-ore, copper-gold): the World Bank
  Dataset Terms are CC BY 4.0 ("Unless specifically labeled otherwise…")
  with the attribution format "The World Bank: Dataset name: Data source"
  — now rendered on the cards. → `yes`.
- **FRED citation-required** (STLFSI, NFCI, VIX, T10Y2Y, T5YIFR, the
  Philadelphia Fed survey, the OECD Bund/JGB/Gilt/BoJ/BoE series): the
  FRED legal page says of that class "you may use these data series with
  proper attribution of the source and acknowledgment that you obtained
  the data from FRED (example, 'Source: BLS via FRED') when displaying or
  publishing it" — the reading attributions now carry the "publisher via
  FRED" citation (e.g. "Cboe via FRED (VIXCLS)"). → `yes`.
- **China PMI stays private** (hand-entered, publisher terms unread) and
  **the Shiller pair stays owner-refused** (ownerAccepts false, source
  kill-switched) — the generated hidden set is exactly
  `[china-pmi, shiller-cape, shiller-ecy]`.

The world-currencies board rides a dated owner directive
(`OWNER_PUBLIC_BOARD_OVERRIDE.fx`, the 2026-10-18b markets pattern), the
eth-usd owner override is retired with its card, and the T-15 gate
(check-site-mode.mjs) now pins BOTH boards public with their evidence
notes. The registry/audit/overrides files were regenerated: 65 indicators,
3 hidden, `hiddenBoards: []`.

### What came back

- **The world currencies section** (10 ECB-reference pairs, 7 backtested
  pattern rules — risk-off, carry, dollar strength, Europe worry, the
  China link — the dollar-at-a-glance row, the quiet area, the pairs
  table with per-pair detail panels): `/api/insights/fx` serves it
  publicly, the SPA section renders (the bundle's own gating reads the
  regenerated overrides file).
- **"Are markets nervous?" gets its voters back**: STLFSI, NFCI, VIX,
  the gold/silver ratio + the FNG context card — and the eth-usd price
  card is RETIRED (the owner: a second crypto price is not a
  market-stress indicator; the prices board carries crypto prices). The
  definition, adapter leg, copy, schema id and owner override all went
  with it (66 → 65 indicators).
- **Borrowing costs / growth get their cards back** (the yield curve,
  the ECB deposit rate, Bund/JGB/Gilt, the BoJ/BoE policy rates, the
  5y5y breakeven, the Philadelphia Fed survey, copper, platinum,
  iron-ore) — all with live, fetched data.
- **The gold balance heals as a side-effect**: 3 of its 5 conditions were
  reading 'unknown' because their inputs (breakeven, STLFSI/NFCI, the
  dollar basket) were licence-hidden; with the inputs restored the
  balance weighs real conditions again.

### The balance round (gold's tilt, silver's retirement)

- **Silver's balance is retired entirely** (the owner: "I dont need
  balance scale of Silver, remove that section entirely") — the
  `<BalanceScale metal="silver">` render, the `metal` prop, and the six
  balanceSilver copy variants are gone; silver keeps its analysis card
  (VerdictStrip) and its price-footing row.
- **Gold's tilt reads the DIRECTIONAL load** (the owner: "the tilt of
  balance for gold is too slow, currently one side has an item, other
  doesn't have at all, but they are seemingly aligned"): the presentation
  scale is now `|net| / (for + against) × 10°` clamped to [3°, 10°] — the
  share of the pan load on the heavy side. A one-sided pan tips the beam
  the whole way; a 2:1 majority tips ~6.7°; an even split stays level.
  Neutral/unread conditions never sat on a pan, so they can no longer
  damp the picture. The verdict words, counts and the UI-40 sparse rule
  are untouched; the swing envelope, needle arc and stage geometry all
  derive from the same constants.

### The panel round

- **The Australia signals bullets name the flagged indicators with their
  live values** (the owner: the count-only bullets "only repeat the
  fields which are just mentioned on the header") — "Inflation & rates ·
  Critical — Australian prices vs a year ago 4.4% · Underlying inflation
  4.4% and 1 more", the click drills into the first flagged card. Farsi
  renders the same data in Persian digits («… · بحرانی — تغییر
  قیمت‌ها… ۴٫۴٪ و ۱ شاخص دیگر»). The count sentence stays as the honest
  fallback when no value is displayable.
- **The hero's weekly-event line is retired** («رویداد این هفته: …») with
  its two copy keys and the HeroBlock prop; the week's status changes
  live on in the full data export + CSV (their own surfaces).

### Gates

- Tests: web 696, insights 533, core 191, api 335, markets 13, scraper
  67 — all green; typecheck 6/6; lint 0 errors / 15 accepted advisories.
- Copy: audit CLEAN (137 backfilled triages — the 2026-10-21 data-integrity
  round's recovered fa copy was never triaged by that session — plus this
  round's 2 new keys and the 2 shipped map-cell drifts; 8 retired keys
  dropped from the manifest).
- Bundle: the Insights lazy chunk is 757.01/182.41 kB — SMALLER than the
  live deploy (761.20/185.13, itself already past the old 700/169 line
  the deployed round never re-checked) — budget consciously bumped to
  765/186 for the restored currencies section + the 12-card corpus.
- T-15 (SITE_MODE=public): 3 indicators hidden, both world boards public
  on their directives.

## [2026-10-20d] — the World card gets its picture: the owner's New York photo joins Sydney's band (owner round)

The owner's directive: "Use this picture, turn it to webP, and use it for
the World container. so both containers aus and world now have picture."
— the uploaded `new-york-bg-fade.jpg` (1400×248, the same band format as
Sydney's `sydney-harbour-faded.webp`). The World (Global) region card's
header band swaps its faint world-map texture for the New York harbour
photo, so both region headers now open on a photograph. No data, scoring,
copy or other page changes — a presentation-only round on the restored
editorial hero.

### The asset

- `apps/web/public/assets/artwork/new-york-bg-faded.webp` (18.7 KB) —
  the owner's JPEG converted to webp (quality 82, method 6) with one
  recorded normalization: contrast ×1.4 + brightness ×0.97. The upload is
  a high-key, low-contrast fade (luma std 17.9 vs Sydney's 27.0, no
  darks below 123) that read as a blank wash through the band veil; the
  lift brings it to Sydney's measured band weight (mean 231.1 vs 231.4,
  std 24.0 vs 27.0) with zero pixel clipping, while keeping the owner's
  airy, watercolour-like fade as the aesthetic.
- `global-map-faded.webp` stays in the tree, unreferenced, for the record.

### The wiring (index.css `.ei-hero-art--global`)

- The photo rides the SAME veil family as Sydney's band (the 26% flat
  surface tint; dark mode 0.5) — the retired "map must stay even quieter
  than Sydney" sub-rule was about the map texture, not about photos.
- Two photo-specific tunings, because the owner's photo composes
  differently from Sydney's: (1) the framing window sits at `72%` — the
  same offset as Sydney's — so the frame lands on the Empire State /
  One WTC cluster (Statue of Liberty left, Brooklyn Bridge far right)
  instead of empty haze; (2) the bottom fade completes at 30% of the band
  (desktop; 34% mobile) instead of 46%, because this skyline rides the
  horizon at the photo's middle third — the old fade dipped the
  skyline under a 73-100% surface wash (the photo's subject was
  mathematically erased; row-level render measurements confirmed 0.0
  detail where the skyline should be). Only the water-reflection sliver
  dissolves into the card seam now.

### Gates

- web 698/698 · typecheck 6/6 · lint 0 errors / 15 accepted advisories ·
  copy:audit clean (no strings changed) · visual 19/19 (U-01..U-14 on the
  new band) · budgets held with NO JS change (entry 295.28/88.81,
  Insights 697.38/167.88 vs 296/89.5 and 700/169) — CSS + public asset
  only; the webp rides the PWA precache.
- VLM visual pass on the regenerated captures: the two bands read
  "reasonably balanced" (Sydney 8/10, New York 6/10 — the remaining
  softness is the owner's own fade), the NYC skyline unmistakably
  visible (Statue of Liberty · Lower Manhattan · Brooklyn Bridge), all
  title/pill/count text readable EN + fa, mobile + RTL clean, zero
  overflow.

## [2026-10-20 (owner UI restore)] — the previous UI returns over the v3 data layer ("I liked the previous UI more… in the PREVIOUS UI")

The owner's directive, on seeing the merged v3 surface live: "I liked the
previous UI more, especially for the world and australia header sections.
please revert back to the previous version UI, but keep the new data,
connections etc. I mean keep those part of updates which are about the
indicators and their connection and reliability. but in the PREVIOUS UI."
Presentation reverts to `main@1e39a24`; the v3 **data** layer (sources
registry, connections, reliability machinery, state words, delayed tier)
stays and feeds the restored surface unchanged.

### Restored (previous UI, verbatim from `main@1e39a24`)

- **Hero (the world + Australia header sections)**: the editorial hero —
  art-band region cards (Global first, D7), tinted verdict pill + the
  four-step meter, needs-attention tiles with numbers + "+n more",
  compact gauge rows with state badges, the rule-toggle/signals closing
  panels, the R4 biggest-move card, and the mobile Global-first swipe
  carousel (dots + prev/next + swipe cue below 768px). The v3 UI-01..14
  card (verdict sentence / reading bar / why-3 / what-next / freshness
  chip / data-trust alert box) is retired by the directive.
- **World-section hero integrations return**: the raised world-markets /
  world-currencies bullets (§5.3/§6.5) and the two section indicators
  (§6.11/§9.10) ride the Global card again (`marketsAlert`/`fxAlert`/
  `sectionIndicators`, via the unchanged `world-feeds.ts` hooks).
- **`ContinueStrip`** returns under the hero (the fidelity round's
  "bottom information strip"); the v3 `MovesNextStrip` retires from the
  page (the component file stays, unused, mirroring how the merge kept
  `ContinueStrip.tsx`).
- **Full markets table**: the round-46/47 lens columns return (Today ·
  1 week · 1 month · 3 months · 1 year · from-high) plus the Trend
  column (Step-1 F2: word + arrow from the same 3-month number) and the
  Status column — the v3 UI-27 column cut is retired. The lens fields
  never left the contract (the merge kept them for the exports), and
  **UI-27's local-currency note is kept** on the restored table (an
  honesty caveat, not a column change). The visual fixture regains its
  synthetic `chg1w`/`chg1y` so the harness exercises the columns.
- **Tests**: `hero-editorial.test.tsx` (the editorial carousel's 20
  regression guards) is restored; visual **U-01** re-pinned to the
  restored hero (region cards, pill, 3 tiles per card, gauge rows, R4
  mover, the live markets bullet) and **U-11** re-pinned to the restored
  column set + the kept note.

### Kept (the v3 updates about indicators, connections, reliability)

- The whole data layer: sources risk registry + method ladder (T-25/T-27/
  T-28/T-30..T-34), new adapters (Shiller FS-06 pipeline, owner-disabled),
  connections/relationship machinery, validation + sanity gates,
  `RULE_VERSION` — untouched.
- The state language (six words + Delayed tier), `StatusChip` rework,
  on-face `CardMeta` source/freshness meta rows, the header data-health
  chip (UI-50), the About rework (UI-49 per-source table), owner-gated
  exports (M-3), the M-5 panic switch, the per-metal v7 `BalanceScale`
  with the UI-40 sparse-honesty rule (already main's component), the
  5-event calendar with tz labels (UI-47), relationship cards with
  neutral "N of M" summaries (UI-46), the markets/fx public gating —
  all still in place; the restored hero simply renders from the same
  snapshot.

### Gates (restored-UI tree)

web unit **698/698** (678 + the restored 20-test editorial suite) ·
typecheck 6/6 · lint 0 errors/15 advisories · copy:audit clean ·
visual acceptance **19/19** (U-01/U-11 re-pinned; U-02 overflow held at
360/768/1200 across the restored carousel; U-13 clean on the restored
sources) · bundle budgets: the Insights lazy chunk measured **697.38 kB
raw / 167.88 kB gz** — the restored editorial markup is +10.60/+2.43 kB
over the v3 card, budgets bumped 687/166 → **700/169** with this entry
as the justification (entry chunk untouched 295.28/88.81) · self-check
regenerated (see SELF_AUDIT.md + the dated export).

## [2026-10-19 (v3 merge)] — the v3 Insights rebuild merges with main's parallel owner rounds and ships

The owner's directive: "Commit Push deploy. merge with main branch. and
deploy and release." The `insights-rebuild` branch (12 commits, the v3
spec package 100% implemented, 1,637 tests at Phase 9) merges with
`origin/main` (96 newer commits of parallel owner rounds — balance v6/v7,
asset-cards sidebar, world-indices briefing, ≥96px wordmarks, editorial
hero + fidelity + panels, Australia signals, yearly/weekly/monthly lenses,
prices rounds — all live on currena.ir). Two owner-directed streams, one
tree; the v3 spec package (uploaded last, at `1e39a24`) stays the
governing authority for the Insights page.

### Merged — v3 spec governs, main's machinery implements

- **Balance (UI-45/UI-40 on the v7 machinery)**: the merged card renders
  the owner's v7 `BalanceScale` (pans, SVG mechanical layer, needle +
  three-tick arc gauge — kept verbatim) **per metal** — gold AND silver
  each get their own balance; the silver-only industrial condition rides
  silver's balance (the separate short list is retired); `range`-safe
  honest counts ride both (UI-39.5 readable-count line); **UI-40**: fewer
  than 3 readable conditions → level beam, gauge hidden, the honest
  refusal wording (readable 0 keeps the owner's "Can't read the
  conditions right now", 1–2 shows the spec's "Not enough readable
  conditions to weigh"); the v6 2° floor keeps governing readable ≥ 3
  tilts. The retired rebuild-only `Balance.tsx`/`balance.ts`/`readable.ts`
  and their pins are deleted; the 12° helper law is superseded by the
  owner's iterated 8°/2° law + the sparse rule.
- **Hero**: the v3 hero (verdict sentence + reading bar + why-3 + calm
  line + what-next + freshness chip + alert box, UI-01..09) replaces the
  editorial carousel/art-band hero of the fidelity round; the
  `ContinueStrip` under the hero is replaced by the spec's
  `MovesNextStrip` (UI-18/19, real readings + dates); the section
  indicators stay off the v3 hero by its documented choice.
- **Stock table**: the exact UI-27 six-column set (Trend gone, U-11 pin)
  inside main's editorial briefing (movers, heatmap, wordmarks, breadth);
  the week/month/year data stays available through the five-lens view
  switch and every export.
- **Boards**: the owner's 2026-10-18b markets directive survives (the
  markets board is public, fx stays hidden) — now behind the M-5 panic
  switch (`accessModeOf` + `HIDDEN_BOARDS`).
- **Fetching (T-25/F-09)**: Yahoo keeps the honest `CurrenaDashboard/1.0`
  UA (never main's spoofed Mozilla) at `range=2y` (round 47's yearly
  anchor); the M-6 kill switch guards both providers.
- **Tools (UI-51/UI-53)**: the owner sign-in + gated exports + live mode
  switch ride main's grayscale control language at the v3 44px touch
  minimum.
- **Infra**: union-merged budgets (measured merged-tree 686.78 kB raw /
  165.45 kB gz → budgets 687/166, the entry chunk untouched at
  295.28/88.81), state tokens + `--ei-navy` + market-logo CSS both sides,
  copy manifest union (+silver balance strings, +verdictNone/silverOnly
  triage, −6 retired rebuild-only entries).

### Gates (merged tree)

1,804 tests green (core 191 · scraper 67 · insights 521 · markets 13 ·
api 334 · web 678) · typecheck 6/6 · lint 0 errors/15 advisories ·
copy:audit clean · T-15 + bundle budgets held · visual acceptance
**19/19** (U-09/U-09a re-pinned to the merged BalanceScale, U-10
duration-based) · self-check **25/25** — SELF_AUDIT.md + the dated
export regenerated.

## [2026-10-19 (yearly lens)] — the stock indices gain a Yearly view, carried by a real chg1y in the stored contract (owner round 5)

Owner round 5: "add yearly view to the stocks indexes." The world-indices
handoff had refused to fabricate an annual lens (no field in the contract);
this round closes that gap the honest way — a contract + pipeline change,
never a frontend derivation.

### Added

- **`chg1y` on `MarketEntrySchema`** (OPTIONAL, like `chg1w`/`chg1m`) —
  last close vs the last close on or before the same date one year
  earlier, percent. A stored row without it is a pre-round-47 row and
  renders an honest dash; the next markets run rewrites every row with it.
- **The year-ago anchor rule** (`compute.ts yearAgoAnchor` + config
  `CHG1Y_ANCHOR_DAYS`/`CHG1Y_ANCHOR_TOLERANCE_DAYS`): the strict 365-day
  rolling anchor, and — because both free providers cut history at
  exactly one year (verified live 2026-10-19) — when the series' first
  close falls inside the ±15-day band around the target (350–380 days
  back, the repo's `yoyPctSeries` year-on-year convention), that earliest
  close IS the anchor. Closer-than-350-day windows omit the field.
- **Yahoo `range=2y`** (was `1y`) on the fallback fetch — the yearly
  anchor always carries real closes with margin (verified live: 1y
  returns points from exactly one year back; 2y from two years).
- **The Yearly lens** («سالانه») as the fifth radiogroup option after
  Quarterly — breadth, coverage note, movers, tiles, heatmap scale and
  aria all re-read `chg1y` through the one `viewValue` lens map; the
  default stays the NORMAL 3-month lens (owner round 44).
- **A "1 year" column** beside 3 months in the full table (desktop +
  mobile row list) and a **"1 year %"** column in the world-markets CSV
  (appended at the END — position-pinned scripts keep reading every
  existing column at the same index) and the full export.
- 3 new copy keys × 2 locales (`viewYearly`, `thYear`, `csvColYear`);
  Persian copy manifest round `markets-yearly-lens-2026-10-19`.
- 6 new test guards (1,612 total): the five-horizon lens list (YTD and
  52w-distance still refused), the strict/one-year-window/omission anchor
  cases, the rendered yearly surface with the honest dash + coverage
  note, the `range=2y` URL, the export slots, and the 16-market payload
  still under 13 KB with `chg1y` on every row.

### Changed

- The spec's §11.2 data-gap report is marked CLOSED by this round
  (§11.6 documents the shipped design); §6.3/§6.4 list the five lenses
  and the new table column.

### Budgets

- All held without bumps: entry untouched (295.29/88.81), Insights
  660.88/158.00 vs 661.00/158.50.

## [2026-10-20 (australia signals)] — the Australia card closes with the same signals box as World Signals, carrying its own area data (owner round 4)

Owner round 4 on the hero's closing modules: "Just like World Signals, I
want the same Box with proper data for Australia." The world-section
signals stay Global-scope — Australia's proper data is its OWN areas, so
its signals box raises the gauges themselves.

### Added

- **The Australia signals box** («سیگنال‌های استرالیا») — the SAME
  construction as the Global world-signals panel (always open, never
  behind the toggle; 15px bold heading + bullets; the state mark 18/20;
  the region's own pale tint + step ink on the heading), with one bullet
  per Australian gauge, worst first:
  - the raised areas (step 2+) speak their counts and state word in
    their OWN step ink — "{area} · {word}: {warnings} of {voting}
    indicators need attention." (the markets bullet's shape) — and jump
    to the Australia section where their lanes live;
  - the calm areas (step 1) sit in the quiet rows' muted ink as
    "{area} · Stable", and the unreadable ones (step 0) honestly as
    "{area} · not enough data to read" — never buttons.
  New hooks scoped to the new content: `data-ei-area-bullets`,
  `data-ei-area-signal="raised|calm|no-reading"`, `data-ei-area-step`.
- Two new copy keys, en + fa (`australiaSignalsTitle`,
  `australiaSignalArea` — Persian copy manifest round
  `australia-signals-2026-10-20`); the quiet rows compose existing keys
  only.

### Changed

- **The round-3 rule toggle becomes the shared FALLBACK** — a region
  with nothing to raise keeps the low-key rule toggle (no feeds on
  Global / no readable gauge on Australia). On a readable Australia the
  signals box replaces it; the word-choice rule is always reachable
  through the "?" tip beside the gauges heading on both cards.

### Budgets

Insights lazy chunk 659.00/158.00 → **661.00/158.50** (measured
660.14/157.86; the entry chunk untouched at 295.29/88.81 vs 296/89.5) —
the AU panel branch + the area bullets + the two new strings; gz
+0.37 kB. D-39 in `docs/DECISIONS_FOR_ALI.md`. The panel guards in
`apps/web/src/components/insights/hero-editorial.test.tsx` grow 3 → 6
(the AU box structure + jump + counts, the no-readable-gauge fallback,
fa area bullets with fa digits); 20 guards total.

## [2026-10-19 (panels)] — the rule panel tucks behind a low-key toggle; the world-signals panel becomes the hero's emphasized closing module (owner round 3)

The owner reviewed the fidelity-round hero and returned two directives on
the closing explanation panels: the long word-choice rule («مبنای تعیین
وضعیت هر حوزه») is reference material that should stop occupying the
card, while the Global signals («سیگنال‌های جهانی») are "probably one of
the most important parts of the whole hero" and must read that way.
Presentation-only again: no calculation, feed, count, ranking, aria hook
or translated string changes (both panels reuse their existing copy keys).

### Changed

- **The rule panel hides behind a low-key toggle** — the always-visible
  tinted rule panel (Australia, and Global's no-feed fallback) collapses
  to one quiet muted pill (the established "+n more" disclosure language:
  `verdictRuleLabel` + a direction-neutral chevron, `aria-expanded`/
  `aria-controls` like GlossaryTip); the click reveals the familiar
  tinted panel beneath it — same hooks (`data-ei-panel`,
  `data-ei-panel-kind="rule"`, `-heading`, `-rule`), same copy, same
  tint ladder. The Australia card stops spending its closing module on
  the reference paragraph.
- **The world-signals panel steps UP in type** — the Global panel's
  heading and every bullet rise from the 12.5px caption tier to 15px
  bold (`leading-relaxed`), the state mark grows 16/18 → 18/20, the
  bullet rhythm gets roomier (1.5 → 2 spacing) and the panel padding
  breathes (px-3/py-2.5 → px-3.5/py-3) — emphasis through type and
  space, not louder chrome: the pale-red surface, region-step ink and
  the `data-attention-box`/bullets hooks stay exactly as approved. The
  panel is never tucked behind the toggle — it is always open.

### Budgets

Insights lazy chunk 657.00/157.50 → **659.00/158.00** (measured
658.10/157.49; the entry chunk untouched at 295.29/88.81 vs 296/89.5) —
the disclosure button + chevron + branched heading markup; gz +0.32 kB.
D-38 in `docs/DECISIONS_FOR_ALI.md`. The three panel guards in
`apps/web/src/components/insights/hero-editorial.test.tsx` now exercise
the disclosure (collapsed default → click → real panel, signals panel
never toggled); 17 guards total.

## [2026-10-19 (fidelity)] — the economic indicators hero closes the gap to the approved reference (the owner's UI-fidelity correction brief)

The owner reviewed the editorial hero round against the approved
`currena-hero.zip` references and returned a correction brief: the result
still read as a generic KPI dashboard, not the approved editorial financial
interface. This round corrects the actual causes — presentation-only again:
every calculation, threshold, ranking, aria hook, count, feed and translated
string is untouched (the panel/strip copy is the only addition, triaged in
the Persian copy manifest round `editorial-fidelity-2026-10-19`).

### Changed

- **Page content width (brief §3)** — the old `xl:max-w-[1440px]` cap left
  80–160px dead margins on 1600–1760px screens; the Insights container now
  rides `lg:max-w-[calc(100%-40px)]` / `xl:max-w-[calc(100%-56px)]` /
  `2xl:max-w-[1840px]` — 1544px (96.5%) at 1600, 1704px (96.8%) at 1760,
  with a ceiling so ultra-wide desktops keep a sane reading measure. The
  page title steps up to 34px desktop (inside the spec's 32–36px band).
- **The art band shows (brief §4)** — the uniform veils over the Sydney
  Harbour / world-map artwork were too heavy (the artwork read as absent):
  Australia's veil drops 30% → 12% surface mix, Global's 46% → 30% with its
  overall opacity raised to 0.85 — the reference's clearly-visible faded
  band, with the bottom fade (and the mobile/dark toning) keeping the
  header's contrast.
- **The severity mapping bug (brief §5 — the round's named defect)** —
  `.ei-row-accent` hardcoded the Crisis red for flagged rows in BOTH
  regions, so a Stressed Australia wore red row edges. The accent now
  follows the region's own verdict step via the card article's
  `[data-ei-step]` → `--ei-accent` custom property (Critical → red,
  Stressed → the amber/orange stressed ink, Cautious → watch amber); the
  icon-less row's fallback triangle and the attention-count line speak the
  same region ink. Status and row presentation can no longer disagree.
- **Category summary rows (brief §7)** — the round-42 status-grouped boxes
  ("Stressed: … / Stable: …") become the reference's compact category
  rows: one quiet row per gauge — category label · small tinted state
  badge · the four-step mini meter (the reference's severity bar) — worst
  state first, unreadable gauges last in honest neutral, the module headed
  by the existing `heroGaugesLabel` + the verdict-rule tip.
- **The contextual explanation panel (brief §7)** — each regional card now
  closes with the reference's restrained tinted panel: Global carries the
  raised world signals (markets / currencies / section indicators — the
  existing module, now with a clear `worldSignalsTitle` heading on the
  pale-red surface; underline affordances dropped per the brief) and falls
  back to the word-choice rule when no feed has loaded; Australia carries
  the existing `verdictRuleLabel` + verdict-rule explanation on a pale
  amber surface. The tint follows the region's own step ink, never a
  saturated warning surface.

### Added

- **The bottom information strip (brief §7)** — `ContinueStrip`: the
  reference's compact footer strip under the hero, naming the page's next
  sections in their intended order (the JumpNav labels, hero excluded) and
  wired to the same expand-then-scroll navigation. Two new copy strings ×
  2 locales (`ui.worldSignalsTitle`, `ui.continueLabel`).

### Budgets

Insights lazy chunk 656.00/157.00 → **657.00/157.50** (measured
656.80/157.17; the entry chunk untouched at 295.29/88.81 vs 296/89.5) —
the category rows + panels + strip are compressible JSX + 2 copy strings.
D-37 in `docs/DECISIONS_FOR_ALI.md`. Seven new regression guards in
`apps/web/src/components/insights/hero-editorial.test.tsx` (17 total).

## [2026-10-19] — the economic indicators hero becomes the editorial financial interface (the currena-hero.zip handoff round)

The owner's `currena-hero.zip` handoff package (approved visual references,
`spec/economic-indicators-ui-spec.md`, design tokens, Sydney Harbour + world-
map artwork — recorded in the repo as
`docs/insights/economic-indicators-editorial-spec.md`) reshapes the Insights
hero on `/#/insights`, presentation-only: every calculation, threshold,
ranking, aria hook, count and translated string is untouched (the new
carousel copy is the only addition, triaged in the Persian copy manifest).

### Added

- **The Global-first mobile swipe carousel (spec §10)** — below 768px the
  two overview cards become ONE horizontal scroll-snap track: Global first,
  swipe (or the localized cue / two `aria-current` dots / Previous-Next
  buttons / ← → Home End keys) to reach Australia. Both cards stay mounted,
  so each keeps its own expand/collapse state while swiped off-screen; the
  furniture is `md:hidden`, so the 768–1023px tablet keeps the calm stack
  and ≥1024px keeps the FIXED desktop placement (Australia left, Global
  right, both locales). Ten regression guards in
  `apps/web/src/components/insights/hero-editorial.test.tsx`.
- **The quiet art band (spec §7)** — the Sydney Harbour / Opera House
  artwork (12 KB WebP, from the handoff pack) behind the Australia card's
  header, an even fainter world-map texture (4 KB) behind the Global card:
  decorative `aria-hidden` layers under a surface-colored veil + bottom
  fade, toned further down in dark mode and on narrow cards. The artwork
  joins the PWA precache (`webp` added to `globPatterns`).
- **The editorial ink + severity pill (spec §4/§5)** — the region titles,
  the flagged rows' key values and the page title speak the navy print ink
  `--ei-navy` (#0F2D4A light / the existing light ink in dark); the
  verdict word + state artwork ride ONE compact tinted pill
  (`.ei-state-pill`, the same ink+tint pairing the StatusChips speak) with
  the four-step meter unchanged beside it; the hero-scoped grayscale
  filter (the 2026-10-18a scope trim) is retired — the new direction
  restores the restrained severity colors on the hero.
- **The flagged rows' editorial anatomy (spec §8)** — the indicator's own
  subject artwork leads in a soft neutral container (the alert triangle
  keeps the tier where the icon set deliberately has no artwork), the
  severity accent is the thin inline-start tier edge, and a directional
  drill-down chevron (`.ei-row-chevron`, mirrored in RTL) closes the row.
  The top-3 + "+n more" → "Show fewer" disclosure is byte-identical in
  behavior.

### Budgets

Insights lazy chunk 652.00/156.50 → **656.00/157.00** (measured
655.04/156.73; the entry chunk untouched at 295.29/88.81 vs 296/89.5) —
the carousel controls + art band + pill + row anatomy + 10 copy strings ×
2 locales; the two artwork files ship as public assets, not JS. D-36 in
`docs/DECISIONS_FOR_ALI.md`.

## [2026-10-18 (2)] — the index wordmarks render at the owner-directed ≥96×96 px (deployed as worker 20b9549c)

The owner's follow-up directive on the freshly deployed briefing — "The
pictures of each indices are too small make them at least 96x96 pixel" —
raises every rendered index wordmark box to ≥96×96 px (the supplied JPEGs
are 256×256, so 96–112px renders stay sharp). UI-only: tiles 96 (STACKED
above the name — the explorer grid runs 2→7 narrow columns, so a 96px logo
beside the text would starve the canonical name; name bumped one type step
to `--type-label`), the featured movers 96 mobile / 112 desktop (the cards
are half/full-width, the horizontal identity row keeps its room; name at
1rem), the detail heading 96 beside the name block (name at
`--type-number`, the same logo + name + country anatomy every surface
wears). The white chip's corner radius is capped at 16px — the old /4
proportion would give a 24–28px radius on the big chips and read as a
pill; every pre-existing small-size rendering is unchanged. The heatmap
and the full table stay text-first (data-density views; no pictures to
resize). Two regression guards added (briefing.test.tsx): every rendered
logo box ≥96px on BOTH breakpoints, and the detail panel carries the same
≥96px wordmark. No copy changes (audit clean), no contract change, no
provider/cron/KV/route change. Budgets held (Insights 650.29/155.75 vs
652/156.50). Live-verified fa/EN desktop + mobile 390/320 (zero overflow,
zero console errors) — evidence:
`docs/insights/screenshots/world-indices-briefing/logo-96px/`.

## [2026-10-18] — the world stock indices section becomes the editorial market briefing «نبض بازارهای جهان» (the owner's world-indices handoff round; merged to main + deployed as worker b9a412e0 — see DEPLOY.md)

The owner's handoff package (`01-new-session-prompt.md`, `02-ui-spec.md`,
`03-agent-rules.md`, `ASSET-MAP.md` + 16 index wordmark JPEGs + a
non-authoritative style image) reshapes the World stock markets section on
`/#/insights` into an editorial market briefing, UI-only. The governing
spec records the round as §11 of `docs/specs/insights-world-markets.md`;
the copy decisions live in
`docs/localization/world-indices-copy-review.md`.

### Added

- **The editorial header (§3.1)** — «نبض بازارهای جهان» over the new
  descriptive label «شاخص‌های بورسی جهان», the §3.1 descriptor subtitle,
  and the «آخرین داده‌ها · پایان جلسهٔ معاملاتی» badge beside the as-of
  date ("live"/"real time" remains banned wording).
- **The breadth layer (§3.2)** — the summary card's selected-period
  up/down/flat strip («شاخص‌های مثبت / منفی / بدون تغییر») plus the
  separate below-52-week-high count line, both computed from RAW stored
  values in the new pure module
  `apps/web/src/components/insights/world-markets/briefing.ts`
  (`marketBreadth` reuses the section's ±1% flat band; `belowHighCount`
  reads `CORRECTION_PCT` from the markets config block — a −9.96% distance
  that displays as −10% is NOT counted).
- **The featured movers (§3.4)** — `world-markets/MarketMovers.tsx`:
  «بیشترین رشد» / «بیشترین افت» as true extrema of the selected period
  (`topMovers`: missing lens rows are never ranked as zero; no valid rows →
  the honest empty state, never a fake winner), each card carrying the
  logo, canonical name, country/market, signed return and the 52-week
  distance as secondary context.
- **The index wordmarks** — the 16 supplied 256×256 JPEGs ship as
  `apps/web/public/assets/markets/{marketId}.jpg` (named by canonical id so
  a file can never drift from its data row); `world-markets/MarketLogo.tsx`
  renders them in a standardized white chip (object-fit contain, hairline
  ring, initials fallback on load failure) — supplementary identifiers
  that never override the canonical names.
- **The desktop performance map (§3.6)** — `world-markets/MarketsHeatmap.tsx`
  behind a «فهرست»/«نقشهٔ عملکرد» switch (lg+ only; mobile keeps the
  readable list): EQUAL-AREA tiles (no weighting metric exists in the
  contract, so size never implies importance), the exact signed percentage
  + name + arrow on every tile, a visible zero-centred legend with the
  period-relative note (`heatmapScale` rounds the largest |raw return| up
  to a nice step, per period), keyboard/tap opening the same detail panel,
  and the list/table as the always-available textual alternative.
- **Country/market labels** — every index entry gained `country` in both
  dictionaries (16 × 2 strings; EURO STOXX 50 = «منطقهٔ یورو», Hang Seng =
  «هنگ‌کنگ» — market labels, not countries), shown on tiles, mover cards
  and the detail panel.

### Changed

- **The period control (§3.3)** — the view switch now offers EXACTLY the
  four horizons the stored contract carries: روزانه / هفتگی / ماهانه /
  سه‌ماهه. The "From 52-week high" lens was removed from the switch (the
  distance stays secondary context on tiles, mover cards and the table
  column), and the annual horizon is deliberately NOT offered: no
  `chg1y`/YTD field exists in `MarketEntrySchema` and the weekly series is
  chart-rounded, so deriving one would fabricate precision — the gap is
  recorded in spec §11.2 and closing it needs owner approval + a
  markets-worker contract change.
- **The explorer tiles (§3.5)** — each tile gained the logo + country
  identity row; region groups are semantic `<h3>`s with counts from the
  loaded dataset.
- **The summary card** — the round-44 verdict box now also carries the
  breadth strip + below-high line; the verdict anatomy, the §6.11 measure
  line, the hero count and the takeaway templates are unchanged.
- **Copy** — 38 new + 3 changed + 5 removed fa strings through the audit
  workflow (round `handoff-world-indices`, reference
  `docs/localization/world-indices-copy-review.md`; manifest 2,203, audit
  clean). Notably «سقف یک‌ساله» was kept over the handoff's suggested
  «سقف ۵۲هفته‌ای» (the repo terminology dictionary is the final authority),
  and the legend's «٪» glyph routes through the new shared
  `percentGlyph()` so no new hardcoded literal ships.

### Tests

- `world-markets/briefing.test.ts` — the closed lens list, breadth
  (incl. partial data + the ±1 band edges), the raw −10% threshold
  (incl. the −9.96% rounding boundary), top movers on
  positive/negative/mixed/partial/missing/single-valid data + tie order,
  the heatmap scale + tones, and cross-surface period consistency.
- `world-markets/briefing.test.tsx` — 17 rendered-section tests: the
  editorial header, the load states, period changes moving breadth +
  movers + tiles together, the honest dash + coverage note, the
  list/heatmap switch, and the fa/RTL rendering (Persian digits,
  dir-isolated Latin names, the verbatim owner-directed title).
- `markets-verdict.test.ts` updated for the copy-parity suite (incl. the
  no-annual-lens guard and the 16 country labels);
  `full-export.test.ts` re-pinned to the renamed export heading.

### Budget

- Insights lazy chunk consciously bumped **636.00/152.50 → 652.00/156.50**
  (measured 650.28/155.51; +14.37 kB raw / +3.51 kB gz — the new feature
  layer + ~108 strings × 2 locales; the 16 JPEGs are public assets, not
  chunk bytes). Entry chunk untouched (295.29/88.81 vs 296/89.5). D-35 in
  `docs/DECISIONS_FOR_ALI.md`.

### Not changed

Providers, crons, KV, the public read route, the §5.3 signal rules, hero
integration, the detail panel's 52-week chart, the full table, the CSV
exports; no deploy (the branch waits for the owner's review; the legacy
production Django app untouched).

## [2026-10-26e] — the repository root cleaned of misplaced specification markdown (owner cleanup work order)

The owner's minimal-cleanup work order: move the specification-related
Markdown out of the repo root into the EXISTING folders that already hold
their siblings, update every affected live reference, and touch nothing
else. Docs-only: zero code, zero copy, zero behavior change; both moves
are byte-identical git renames (R100 — the contents are preserved
exactly, no rewrite/merge/delete). Rationale recorded as D-34.

### Changed — two files moved, two live references updated

- **`economic-indicators-ui-spec.md` →
  `docs/insights/economic-indicators-ui-spec.md`.** The Economic
  Indicators page UI/UX specification joins its own lineage in
  `docs/insights/` — the sibling UI specs (`02-page-design-spec.md`,
  `06-ux-round-2-spec.md`, `gold-balance-card-spec.md`) and its
  companion record `economic-indicators-verification-notes.md`, whose
  header now points at the new path instead of claiming the repo root.
  NOT `docs/specs/` — that folder is the governing world-currencies /
  world-markets data-spec lineage per AGENTS.md's docs map.
- **`REMAINING_WORK.md` → `docs/REMAINING_WORK.md`.** The CLOSED
  (2026-10-15c) follow-up work order moves in with its process-doc
  siblings (`BACKLOG.md`, `NEXT_SESSION_PROMPT.md`, `PROGRESS.md`,
  `SESSION_LOG.md`); the README docs-map pointer now reads
  `docs/REMAINING_WORK.md`. Its own internal references are
  repo-root-relative prose paths, which remain valid from `docs/`.
- **Left exactly as-is (deliberate, minimal diff):** `README.md`,
  `AGENTS.md`, `CHANGELOG.md` (essential root files per the work
  order); the bare-name spec citations in code comments
  (`VerdictMeter.tsx`, `HeroBlock.tsx`, `ToolsMenu.tsx`,
  `apps/web/src/index.css`, `scripts/check-bundle-budget.mjs` — no
  path, name unchanged, grep-resolvable, so no app-code churn); the
  historical session/decision/changelog records (DEPLOY.md headings,
  D-28, the 2026-10-15 CHANGELOG/PROGRESS rows — records of past
  events, not live pointers); `financial-asset-cards-spec-pack.zip`
  (not a Markdown file and not a supporting asset of the moved specs —
  outside the work order's `.md` scope); `vite-dev.log` (untracked
  local artifact). The root now holds only `README.md`, `AGENTS.md`,
  `CHANGELOG.md` and application configuration. No Markdown-link form
  (`](…)`) references either file anywhere in the tree (audited), so
  nothing else can 404. Pre-existing staleness observed and NOT
  touched (out of scope): `docs/insights/CURRENT_STATE_REPORT.md`
  claims `FIX_REPORT.md` sits at "repo root" (it lives in
  `docs/insights/`).

## [2026-10-26d] — the gold balance rotates ONLY its beam, and visualizes weight (Iteration-5 addendum: v7)

The owner's Iteration-5 addendum supersedes the earlier pan-rotation,
tilt/motion and tile-content rules: "Rotate the beam only, and
visualize weight". The scoring model, the data and the Persian copy
are untouched (the net/total ratio law is byte-identical); only its
PRESENTATION scale changes (max 8° at the model's full range, floor
2° for any valid directional result, exactly 0° for neutral and for
unavailable). Strictly scoped to the balance component + the gauge
copy key.

### Changed

- **Exactly ONE rotating element (BalanceScale.tsx)** — the beam
  group (tapered bar + accent beads + pivot ring + needle) rotates by
  `rotate(θ, pivotX, pivotY)` about the pivot. The v6 CSS-calc stage
  (`--t`/`--s`/`--drop-*`/`25cqw × sin()` + the 0.2×θ pan tilt) is
  retired: the mechanical drawing is now an SVG layer whose hangers
  are recomputed EVERY FRAME as straight lines from each side's
  beam-end joint (cx ± (L/2)·cos θ, cy ± (L/2)·sin θ) to the pan's
  two fixed rim corners. The pans move by `translate(0, dy)` ONLY —
  exactly their joint's vertical displacement, so they hang plumb;
  their rotation is exactly 0°, and tiles/text/icons/pills are never
  rotated, skewed or scaled.
- **ONE animated value in JS (the Odometer's rAF pattern)** — a
  single θ state drives the beam rotation, joint positions, pan
  translations and hanger endpoints in the SAME render frame (no CSS
  transitions on any element, so nothing can desync and detach). The
  SSR/first paint already carries the verdict angle; a changed
  verdict settles over ~500 ms ease-out cubic; reduced-motion users
  land immediately. The stage width is measured pre-paint + via
  ResizeObserver so the whole drawing scales as one piece; the
  vertical travel stays inside the fixed reserved envelope
  (160 × sin 8° ≈ 22.27px at the 640 design width — asserted in
  tests).
- **The pointer-needle gauge (addendum §B)** — a slim needle fixed to
  the beam's pivot, pointing downward and rotating with the beam,
  read against a small FIXED arc scale with THREE ticks only (adverse
  end · centre · supportive end, labelled by verdict — a rigid
  down-needle swings opposite the heavy pan, so the tick the needle
  reaches when a side is heavy names that side; no numeric labels, no
  fabricated thresholds). The needle hides when the state is
  unavailable. The whole drawing is one `role="img"` whose label is
  the needle's text equivalent — `gaugeAria`, round-52, one new copy
  key × 2 locales + QA record + manifest entry.
- **Weight visuals, honestly scoped** — the model audit found: a net
  score EXISTS (count-based: net = for − against), but there are NO
  per-side weighted totals and NO per-factor weights. Therefore the
  side-load bar and the per-tile weight marker are deliberately NOT
  implemented (the addendum forbids fabricating them); the beam angle
  (from the net ratio) and the needle are the only weight read-outs.
- **The v4 keystone is retired** — the addendum's rotating pivot ring
  + downward needle + fixed arc replace the static hub-and-keystone
  mark (the needle's mandated path runs exactly through where the
  keystone sat).
- **balance.test.tsx rewritten (45 tests)** — the angle law on the
  new scale (floor 2°, max 8°, the 1-vs-4 and 5-vs-5 count-vs-weight
  fixtures); the pure `balanceStageGeometry()`/`balanceGaugeGeometry()`
  contracts (plumb drops, θ-free rim x, joint = rotated beam end,
  envelope ≤ 160×sin 8°, stage heights reserve the stack + swing, RTL
  visual-sign flip with direction-free drops); rendered structure
  with the addendum-§A audit (ONLY the beam group carries rotate; the
  two assemblies carry `translate(0px, Npx)`; tiles/hangers/rings/
  text carry NOTHING), hanger endpoints == the pure geometry, needle
  hidden for 'none', the gauge aria in both locales, the target-change
  landing, and all v6 behaviour tests kept (capacity, pills, empty
  pans, interactions, order, integration).

### Verified (addendum §C)

- DOM audit at every fixture: exactly 3 transformed elements (beam
  group rotate + 2 assemblies translate-only); attach error 0.000px
  at θ = 0°, 2°, 5.71°, 8° and at 390/768/1366 × en/fa.
- Mid-animation probe (D→E settle, 49 rAF samples): 0 violations —
  pan drop == joint Δy and rim == pan top + drop on EVERY frame.
- Fixtures: 1-vs-4 → 4.8° (count settles it — the model has no
  weights); 5-vs-5 → 0° "Balanced"; 5-vs-0 → the 8° maximum; all
  unread → 0°, «فعلاً قابل ارزیابی نیست», needle hidden.
- Tile text 12.48px (≥ 12px), horizontal, fa-RTL + en-LTR at
  1366/768/390; zero horizontal overflow at 390.
- Gates: typecheck 6/6; 1,534 tests green; lint 0 errors/15 accepted
  advisories; copy:audit clean (2,170 entries); build + budgets —
  Insights 635.18/152.06 vs the bumped 636/152.50 (D-33), entry
  chunk untouched 295.29/88.81. Merged-tree re-gate with the parallel
  2026-10-26c sidebar round: 1,536 tests green, the lazy chunk
  measures 635.91/152.00 — still inside the bump, no further bump.

## [2026-10-26c] — the asset cards' details move to the side panel (owner directive)

The owner's directive — "The more details must show up in side bar" —
relocates the «جزئیات بیشتر» surface: the five detail sections that used
to expand INLINE inside each asset card now render inside the F5 DETAILS
SIDE PANEL (desktop: inline-end sheet, RTL: start sheet, phones: bottom
sheet). Clicking «جزئیات بیشتر» opens the panel (the same dialog the
whole-card click-through opens) with the sections directly under the
card facts — the card itself NEVER expands, so the four-tile grid stays
compact and stable, and the details inherit the panel's focus trap,
Escape, scrim, scroll lock and focus-return for free. No section content
changed: the five sections (A تغییرات قیمت … E منبع داده و زمان
به‌روزرسانی) render byte-identical reviewed copy, from the same data
paths.

### Changed

- **PricesBoard.tsx** — the per-card disclosure (open state,
  aria-expanded/aria-controls, the inline panel div and ~140 lines of
  section markup) is GONE; the «جزئیات بیشتر» button now calls
  `onFocusCard(id, trigger)` (aria-haspopup="dialog", the panel-side
  affordance PanelRight/PanelLeft by locale). The tile slims to the
  collapsed-card facts (trend, daily change, briefing) — all
  panel-only computations moved out.
- **PriceDetails.tsx (new)** — the five sections as a self-contained
  `PriceDetailsSections` component: the shared atoms (ChangeValue,
  PanelSection, DetailRow, NoteLine, formatPriceRange, formatUpdatedAt)
  relocated from PricesBoard, plus `usePricePanelData` — the same
  module-cached history fetch the sparkline and the panel chart use
  (one request, three consumers), keyed by id so a panel that switches
  readings never shows stale stats.
- **DetailsPanel.tsx** — accepts `readings` (the snapshot's full
  readings, for the companion lines) and renders `PriceDetailsSections`
  for the four price rows directly under CardFacts; the panel HEADER now
  carries the card's verified title (priceCardTitles — "Gold price", not
  the registry's legacy "Gold price (ounce)") so the sidebar and the card
  describe the asset identically. Insights.tsx passes the readings.
- **Copy** — `lessDetails` («نمایش کمتر») retired from BOTH dictionaries
  + its manifest entry deleted (the disclosure's collapse label is gone
  with the disclosure; the panel's close affordance replaces it). The `٪`
  technical entry re-homed PricesBoard → PriceDetails with the code it
  terminates. Round-52 triage:
  docs/QA/quirks-2026-10-26c-asset-cards-sidebar.md. `moreDetails`
  («جزئیات بیشتر») stays the button's label.

### Tests

- prices-cards.test.tsx rewritten for the new behavior (+2 net): the
  board tests assert «جزئیات بیشتر» calls onFocusCard with the id + the
  trigger element and that NO sections render on the cards (en + fa);
  the section/coverage/methodology-guard tests now render DetailsPanel
  (the real surface) — all five sections, the «تا» range, the 10-year
  record, the served-attribution notes, the no-methodology guards in
  both locales, and the non-price-indicator negative case. 13 tests in
  the battery (was 11).

Gates: typecheck 6/6; lint 0 errors/15 accepted advisories (unchanged —
the panel-data hook is keyed, not sync-reset); 1,522 tests green (web
550); `copy:audit` clean (2,167 entries); web build OK; budgets held
(Insights 629.41/150.53 vs 630/151; entry 295.29/88.81 untouched).
Verified on the production build + real API (:4173 harness): EN 1280 —
the panel opens on the right (440px, flush inline-end) with the five
sections under the facts, heading "Gold price", focus trapped, body
scroll locked, Escape closes and focus RETURNS to the trigger; fa RTL —
«قیمت طلا» heading, the five Persian sections, sheet flush LEFT, caret
probes prove the range reads «۳٬۹۶۱ تا ۵٬۳۱۸ دلار» (right=۳٬۹۶۱ /
center=تا / left=دلار); mobile 375 — bottom sheet full-width, no
horizontal overflow, scrim click closes; the four tiles stay compact
(zero h4 inside the cards); zero console errors.

*(Rebased over the parallel balance-v6 round `2f9f4e6` — the balance
component's pans re-composition rides beneath; no file overlap beyond
the shared changelog/manifest prepend.)*

**Deployed**: pushed as 99742c2 (rebased over the parallel balance-v6
round) and live on currena-api worker `6adfb632` (SITE_MODE=public,
bindings/cron unchanged; currena-markets untouched); serves
index-gB3_zV9f.js + Insights-DW1SDXvu.js — the fresh build's exact
filenames, live on both currena.ir and workers.dev. Live-verified:
EN desktop — the right sheet opens with the five sections under the
facts, focus trapped, Escape closes and focus returns to the trigger;
fa RTL — «قیمت طلا», the five Persian sections, the sheet flush LEFT;
mobile 375 fa — bottom sheet, no overflow; zero console errors. Deploy
record: docs/DEPLOY.md §CURRENT DEPLOYMENT; live captures in
docs/evidence/2026-10-26c-asset-cards-sidebar/.

## [2026-10-26] — the gold balance's factors REST ON real pans (Iteration 4: the balance becomes a connected weighing machine)

The owner's Iteration-4 directive: the latest v5 composition (factor
columns above an abstract beam with colored endpoint dots) "does not
convincingly communicate that the factors are the loads causing the
balance to tilt". The required result: real weighing pans attached to
the beam ends with the factor items visibly supported by the pan
surfaces, while preserving the editorial financial-dashboard aesthetic.
Strictly scoped to the balance component, its factor lists, the
aggregate summary and the supporting copy — no page layout, token,
other-card or model change. The tilt law (|net|/total × 12°, 4° floor,
level at net 0 and at readable 0) is byte-identical; the NUMBER of
tiles never sets the tilt, only the documented net/total ratio does.

### Changed

- **The drawing (BalanceScale.tsx)** — one fixed-height CSS stage
  (240px ≥ sm / 260px below, max-w-[640px]) replacing the 520×88 SVG:
  a weightier tapered beam (12px mid, rotating about the compact
  hub-and-keystone pivot), accent beads terminating the beam ends, TWO
  thin suspension lines per side splaying from the bead down to the
  pan's top edge (with tiny junction "ring" dots), and a SHALLOW
  RIMMED PAN per side (1.5px rim, 3px floor edge in the darker ink, an
  inner wall line for tray thickness, soft surface tint, drop shadow).
  The pans HANG at a fixed distance below their beam ends and are
  rigid parts of one translating assembly.
- **Physical coherence, pure CSS** — the beam rotates by the model's
  angle θ (`--s`, RTL-sign-flipped), and each pan assembly translates
  by EXACTLY its bead's drop — `25cqw × sin(--t)` (25cqw = Lh ÷ 2 by
  construction, the beam spans half the stage; `--t` is the
  direction-free physical sign) — and tilts by a restrained
  0.2 × θ (≤ 2.4° at the 12° maximum) about its hang point. Measured
  on the harness: the pan-pair and bead-pair height differences are
  byte-equal (22.32px = 320×sin 4° at case A; 66.53px = 320×sin 12° at
  case E) at every angle. No ResizeObserver, no runtime measurement; a
  browser without CSS `sin()` degrades to the level state (never a
  wrong direction).
- **The factor tiles rest ON the pans** — compact buttons (icon + full
  short label, never truncated + the value where space permits) sit
  bottom-aligned on the pan's floor with a contact shadow, gapped, in
  a fixed-height pan: they read as the loads. Each tap opens the shared
  detail panel. The full-width v5 factor columns above the beam are
  retired.
- **Capacity + overflow (v6 rule 3)** — each pan shows its first
  BALANCE_PAN_CAPACITY (2) tiles; the rest are counted by a "+{n}
  more" pill hanging just under the pan (inside the translating
  assembly, clearly attached to its side, deliberately NOT on the pan
  surface so it can never read as another load or a fabricated
  weight). The pill expands the side's full row list below the
  assessment ("Show fewer" collapses); an empty side shows its full
  evidence-based line WITHOUT any disclosure. Nothing is silently
  omitted; the model still sees every driver; the stage's geometry
  never depends on any count (regression-tested).
- **Empty pans are deliberate (v6 rule 2)** — an empty side keeps its
  COMPLETE pan (hangers, rim, floor) with a minimal muted marker
  inside: `panEmpty` ("No qualifying signals" / «نشانهٔ معتبری نیست»)
  when the evaluation ran, the distinct `panUnreadable` ("Nothing to
  weigh yet" / «هنوز چیزی برای سنجیدن نیست») when nothing could be
  read (readable 0). The five-state semantics of v4 are unchanged.
- **RTL** — the pan columns, captions and list sections mirror via
  CSS-grid direction; the for-bead uses `inset-inline-start` so it
  always terminates the beam end above the for-pan; the beam's visual
  rotation sign flips in JS (`--s`) while the physical drop sign
  (`--t`) stays direction-free. Nothing mirrors text.
- **Copy (round-51, QA record docs/QA/quirks-2026-10-26-balance-v6-fa-copy.md)** —
  2 NEW keys (`panEmpty`, `panUnreadable`) in both locales; all other
  strings byte-identical to round-50. Manifest 2,152 → 2,154 entries,
  audit clean.

### Budget

- The v6 round measured 631.01/150.80 alone (raw +4.01 kB, gz +0.80 kB
  over v5's 627.00/150.00 — the honest price of the directive's
  mandated markup; the entry chunk untouched at 295.29/88.81). Push
  time found the PARALLEL 2026-10-25b asset-cards-polish round on
  origin (629.04/150.69 from the same base) — the merged tree measures
  634.57/151.67 vs the bumped 635.00/152.00 (both rounds' bumps ride
  in scripts/check-bundle-budget.mjs). Justified here and in D-32
  (docs/DECISIONS_FOR_ALI.md).

### Verified

- balance.test.tsx rewritten for v6 (30 tests): the §4/§6/§13 logic
  suites byte-identical (the tilt law, the counts, the verdict words)
  + signedTiltDeg, the rendered structure, the pan-drop CSS law, the
  capacity/overflow disclosure, the distinct empty/unreadable pans,
  the RTL sign split, the no-text-mirror source guarantee, the order,
  the interactions (tile/row/chip → one shared panel; the pill
  expansion) and the merged-card integration.
- On the (temporary, deleted) harness: cases A–H × en/fa ×
  1280/360/320, both themes — pan/bead sync measured exact, zero
  horizontal overflow (320px included), keyboard Enter opens the
  panel, zero console errors, VLM scenario review all pass
  ("coherent machine", "factors clearly read as physical loads";
  its "steepen the tilt / shrink the empty pan" suggestions declined —
  the owner's model and fixed-geometry rules).
- Gates: typecheck 6/6; 1,505 tests (web 533); lint 0 errors / the
  15 accepted advisories; copy:audit clean (2,154); bundle budgets
  held (documented bump above).
- Evidence: docs/insights/screenshots/gold-balance/v6/ (a before/after
  comparison, the full scenario sweep, the interaction captures, dark
  + mobile sets) + README; notes §v6 in
  docs/insights/gold-balance-card-notes.md.

## [2026-10-26b] — the asset cards drop the «دربارهٔ این اعداد» methodology note (owner directive)

A one-scope removal, requested verbatim by the owner after reviewing the
2026-10-25b polish: the sixth expanded-detail section — the heading
«دربارهٔ این اعداد» ("About these numbers") and its three-sentence
methodology body (the shared seven-day window, the daily-change basis, the
no-fabrication rule) — no longer renders on the asset cards. The panel now
carries the five data sections A–E (تغییرات قیمت / محدودهٔ قیمت در ۵۲
هفتهٔ گذشته / سوابق تاریخی قیمت / جایگاه قیمت نسبت به شاخص‌های مرجع /
منبع داده و زمان به‌روزرسانی). The methodology ITSELF is untouched — the
window semantics live in `price-trend.ts` / `price-stats.ts` and stay
documented in the code comments and QA docs; only the on-card disclosure of
it is gone.

### Removed

- **PricesBoard.tsx** — the section F `<PanelSection>` block and its
  header-comment map entry (the comment now carries this round's tag so the
  removal stays traceable where the section used to be described); the rest
  of the component — all five sections, the collapsed card, the conditional
  coverage notes — is untouched.
- **Copy** — `aboutNumbersLabel` / `aboutNumbersBody` deleted from BOTH
  dictionaries (en "About these numbers…" / fa «دربارهٔ این اعداد…»), and
  the two matching entries deleted from
  `docs/localization/persian-copy-manifest.json` in the same commit, per
  the copy workflow's removal rule (manifest 2,170 → 2,168 entries;
  `copy:audit` clean).
- **prices-cards.test.tsx** — the section-F assertion is replaced with
  removal guards in BOTH locales (`queryByText('About these numbers')` and
  `queryByText('دربارهٔ این اعداد')` must both stay null), so the removal
  itself is now a tested behaviour; the A–F labels in the file updated to
  A–E. Still 11 tests in the battery.

Gates: typecheck 6/6; lint 0 errors (15 accepted advisories, unchanged);
1,520 tests green; `copy:audit` clean (2,168 entries); web build OK; bundle
budgets held — the removed copy shrinks the Insights chunk ~1.2 kB
(628.67 kB / 150.59 kB gz vs the 630/151 budget; entry chunk untouched at
295.29/88.81).

**Deployed**: pushed as 648f5aa (no rebase — main had not advanced) and
live on currena-api worker `f9571a79` (SITE_MODE=public, bindings/cron
unchanged; currena-markets untouched); serves index-CKqYpOMM.js +
Insights-7kn32ZoI.js — the fresh build's exact filenames. Live-verified on
currena.ir + workers.dev: en + fa RTL expanded cards show EXACTLY the
five sections with zero occurrences of the removed heading in either
locale, the last section paints inside the tile (element-from-point
probe), mobile 375 no overflow, zero console errors. Deploy record:
docs/DEPLOY.md §CURRENT DEPLOYMENT; evidence
docs/evidence/2026-10-26b-remove-methodology-note/ (sandbox + live).

## [2026-10-26] — the gold balance re-composed to the owner's wireframe reference (factors above, beam beneath)

The owner supplied a hand-drawn reference board
(`docs/ui-reference/gold-silver-balance-target-wireframe.png`, also delivered
via upload) with the target composition: a concise heading + subtitle, the
TWO OPPOSING FACTOR GROUPS at the top (supportive vs adverse columns), a
simplified abstract balance centred BENEATH both groups with its endpoints
visually corresponding to the columns, a compact aggregate assessment under
the illustration, progressive disclosure for additional factors, and a mobile
adaptation preserving the same hierarchy. Strictly scoped to the balance
component and its factor lists — no page, provider, scoring, data or
unrelated-card change. The tilt law (|net|/total × 12°, 4° floor, level at
net 0 and at readable 0) is untouched; no weight, threshold or angle was
invented to imitate the sketch's example tilt.

### Changed

- **The composition (BalanceScale.tsx)** — the wireframe's vertical order:
  the concept's heading + subtitle now lead into the TWO FACTOR COLUMNS
  (side by side ≥ `sm:`, stacked below, DOM order for → against = tab
  order), the abstract editorial beam sits BENEATH them sharing the same
  max-w-[640px] footprint, and the aggregate assessment follows directly
  under the drawing. The v4 order (illustration first, lists beneath it,
  divider-separated verdict at the end) is retired. The beam keeps v4's
  abstract mark — one tapered beam, compact hub + 13u keystone pivot,
  accent endpoint beads, dotted level reference — with the arm re-proportioned
  so the beads sit exactly under the two columns' centres (Lh 336u → 260u =
  25%/75% of the footprint; the canvas 520×104 → 520×88; the ANGLE law is
  byte-identical, only the drawn arm is shorter).
- **Progressive disclosure per column (new, the reference's "view all
  factors")** — each column reveals its first 3 rows (BALANCE_LIST_REVEAL =
  3, the attention-tile convention); beyond that a "+{n} more" pill expands
  the list, "Show fewer" collapses it back — reusing the site's existing
  copy keys (`ui.attentionTileMore` / `ui.showFewer`) and the tiles' pill
  anatomy (`aria-expanded` + `aria-controls` → the column). Neither the row
  count nor the disclosure state can affect the illustration: the zone's
  SVG is byte-identical across 1/2/6-row cases and across expansion
  (regression-tested).
- **The aggregate assessment (the reference's conclusion box)** — the
  verdict word + icon (now in the question voice, the box's focal line),
  the count line, and the C12 banner ride together in ONE compact, centred,
  soft box (bg-currena-soft/60, max-w-440) directly beneath the drawing —
  replacing v4's divider-separated block.
- **The empty side (the reference's deliberate empty states)** — the
  evidence-based line now sits in the same soft tint block (no ring, no
  dashed border — never a placeholder slot), keeping the column's visual
  presence when its opposite carries rows. The five-state semantics
  (no-qualifying-factors vs insufficient vs unavailable vs mixed vs valid)
  are unchanged, as are all their Persian/English strings — zero copy
  changes, zero manifest entries, audit clean.

### Kept (explicitly verified)

- The tilt follows the real model only: supportive dominance lowers the
  supportive bead, adverse lowers the adverse, balanced and
  nothing-readable stay level (all five states regression-tested; the
  harness cases A–E/G/H re-verified by measurement: bead Δy = Lh×sin(angle)
  with 0.0u diff at 1280 and 360).
- RTL mirrors the whole SVG with one scaleX(-1): the for column and its
  bead both land on the inline-end (right) side in fa, the visual rotation
  sign flips with the mirror, Persian digits and the bidi islands render
  correctly (DOM-measured on the harness at 1280; mobile 360 fa captured).
- Rows stay real buttons with aria-expanded + the shared detail panel (one
  open at a time); trays keep the neutral/unread distinction; keyboard
  focus + Enter verified; no horizontal overflow at 320/360/768/1280.

### Budget

- Insights lazy chunk: 626.27/149.92 vs budgets 627.00/150.00 — the raw
  budget bumped +0.27 kB (626.00 → 627.00, gz HELD) for the per-column
  disclosure pills + the assessment box; documented in
  `scripts/check-bundle-budget.mjs` and D-31. Entry chunk untouched
  (295.29/88.81 vs 296/89.5).

### Gates

- typecheck 6/6 packages; 1,506 tests (web 534 — the balance suite now 31:
  the v4 assertions re-pinned to the wireframe order + new
  progressive-disclosure tests; insights 463; api 238; core 191; scraper
  67; markets 13); lint 0 errors / 15 accepted advisories; copy:audit
  clean (zero new strings — the disclosure reuses reviewed keys);
  build + bundle budgets held. Visual loop: baseline (v4) captured →
  implementation → desktop/mobile/dark/RTL captures → VLM design +
  scenario critique rounds → refinements (the empty-state tint block, the
  verdict-word hierarchy, the pill-class dedupe) → final pass clean
  ("professional editorial data visualization", all tilt/empty/RTL states
  verified). Evidence: `docs/insights/screenshots/gold-balance/v5-iteration/`
  (24 captures + README).
## [2026-10-25b] — the asset-cards polish round: editorial hierarchy, one-line prices, honest instrument notes

The owner's polish task: make the four financial asset cards feel like
a premium editorial financial publication — strictly scoped to the
cards and their supporting copy; no page, provider, scoring or routing
change; every working calculation preserved.

### Changed

- **The asset header** — the icon vertically centred against a title
  block: the plain title («قیمت طلا» / "Gold price", 18px semibold)
  over a measurement-basis subtitle («هر اونس تروی» / "per troy
  ounce", 13px secondary). The unit left the title ("Gold price
  (ounce)" retired); the four units verified against the served
  instruments (gold/silver per troy ounce — XAU/XAG spot and the
  GC=F/SI=F live refresh both quote per troy ounce; Brent per barrel;
  Bitcoin per coin).
- **The one-line price (the owner's required correction)** — the
  number (28px bold tabular) and its currency share ONE baseline
  («۴٬۱۶۶ دلار» / "US$4,166") via the new pure `priceValueParts`
  display helper; each part an isolated `<bdi>` so a direction change
  can never split or reorder them. The old two-line block (digits,
  then «دلار» beneath) is gone.
- **The expanded panel reorganised into six semantic sections** —
  تغییرات قیمت (one «X گذشته» label family: «هفت روز گذشته / ۳۰ روز
  گذشته / ۹۰ روز گذشته / ۶ ماه گذشته / ۱ سال گذشته») → محدودهٔ قیمت در
  ۵۲ هفتهٔ گذشته («۳٬۹۶۱ تا ۵٬۳۱۸ دلار», «تا» BETWEEN the endpoints,
  rendered in the locale's own direction) → سوابق تاریخی قیمت →
  جایگاه قیمت نسبت به شاخص‌های مرجع (10-year level + note, 200-day
  gap, distance from the 10-year high, companion ratios — Bitcoin's
  two metal ratios now ONE sentence; fa's second ratio was a
  fragment) → منبع داده و زمان به‌روزرسانی (attribution link,
  observation date vs the app's fetch time, coverage notes) →
  دربارهٔ این اعداد. Section headings drop the latin-only
  uppercase/letter-spacing in fa (tracking visually separates joined
  Persian script).

### Fixed (data corrections, verified against the implementation)

- **The futures note no longer lies on spot prices** — it rendered
  unconditionally on gold/silver/oil while the served EOD snapshot is
  gold-api XAU/XAG SPOT. It now shows ONLY when the served
  attribution actually is the futures quote (the serve-time live
  merge rewrites `sourceName` to the Yahoo GC=F/SI=F/BZ=F attribution
  when a fresher quote wins). Brent's EOD attribution (EIA spot ∪
  BZ=F gap-fill) gets its own accurate blend note.
- **The record label no longer claims all-time coverage** —
  «بیشترین مقدار تاریخی» / "Historical high" became «بیشترین قیمت ۱۰
  سال اخیر» / "10-year high": `computePeaks` reads the 10-YEAR window
  (Brent's own series is explicitly capped to it).

### Tests & gates

- +14 tests (prices-cards.test.tsx: header/one-line price/sections/
  bidi range/conditional notes/disclosure; price-value-parts.test.ts).
- typecheck 6/6; lint 0 errors/15 accepted advisories; 1,520 green;
  copy:audit clean (round-51: 18 new + 5 relabelled strings triaged
  against docs/QA/quirks-2026-10-25b-asset-cards-polish.md); build OK;
  Insights budget consciously bumped 626/150 → 630/151 (measured
  629.04/150.69 — bilingual copy + panel structure; entry untouched).
- Verified on the production build + real production API (harness):
  layout/bidi caret probes (the fa range reads exactly «۳٬۹۶۱ تا
  ۵٬۳۱۸ دلار», U+066C separators), en+fa, 1280/768/375/320, dark,
  keyboard, click-through, zero console errors. Evidence:
  `docs/evidence/2026-10-25b-asset-cards-polish/` (before/after).
- Rebase note: authored against the 2026-10-24d deploy (cc6f28e6) and
  rebased over the 2026-10-26 balance-v5 round (5f37014) before
  push/deploy; the v5 round touches BalanceScale/MergedCard/its tests
  only — PricesBoard and the copy keys are untouched there, and the
  budget script carries both rounds' justifications (627 by v5 → 630
  by this round).
- Deployed: pushed as db31745 → currena-api worker
  ead002b6-3c9e-4e9a-aae9-4535bb462f9f; re-verified LIVE on both
  currena.ir and the workers.dev domain (Insights-BMyE-MXL.js served;
  en + fa desktop and mobile 375: header/one-line price/six
  sections/range/record/conditional notes, no overflow, zero errors) —
  evidence `docs/evidence/2026-10-25b-asset-cards-polish/LIVE-*.png`,
  deploy record in `docs/DEPLOY.md` §CURRENT DEPLOYMENT.

## [2026-10-25] — the gold balance becomes the abstract editorial mark «برآیند عوامل مؤثر بر قیمت طلا» (owner Iteration-2 directive)

The owner reviewed the deployed v3 classic hanging-pan balance ("a literal
weighing scale with suspended bowls, wires, and a tall central column … not
the desired visual direction") and directed the earlier, simpler concept: an
abstract, restrained, editorial visualization. Strictly scoped to the
gold/silver balance component and its factor lists — no page, provider,
scoring, data or unrelated-card change. The tilt law (|net|/total × 12°,
4° floor, level at net 0 and readable 0) is untouched; no weight or threshold
was invented.

### Changed

- **The illustration (BalanceScale.tsx)** — ONE inline SVG in a flat 520×104
  viewBox: a refined slightly-weighted tapered beam (9u at the centre → 6u at
  the ends) rotating around a compact geometrically precise pivot (9u hub +
  surface pin dot + 13u keystone triangle — NO base bar, NO tall column),
  with subtle accent-coloured endpoint beads (green for / red against — the
  only colour in the drawing) and the dotted level reference through the
  pivot. The v3 machinery (pillar, plinth, chains, suspended pans, pan
  translations, the 252u-tall viewBox) is deleted; the geometry was reworked,
  not recoloured or resized. RTL stays one scaleX(-1) mirror; the 500 ms
  reduced-motion-aware tilt transition stays.
- **The hierarchy (Iteration-2 §3 order)** — the block now leads with the
  concept's own heading «برآیند عوامل مؤثر بر قیمت طلا» / "The aggregate of
  factors affecting the price of gold" (card-question voice) + a concise
  explanatory subtitle (caption voice), then the illustration, then the two
  side-labelled factor lists (now sharing the beam's max-w-520 footprint so
  each list sits under its side's half; stacking to one column below sm:),
  then the OVERALL ASSESSMENT at the end (verdict word + count line + the
  C12 banner where needed, divider-separated), then the shared detail panel
  and trays. The v1 "answer-first" verdict placement is retired by this
  directive's own ordering.
- **Side labels + empty-state copy (round-50)** — the list captions become
  «عوامل حمایتی از قیمت طلا» / "Factors supporting gold's price" and
  «عوامل فشارآور بر قیمت طلا» / "Factors pressuring gold's price"; the
  empty-side lines adopt the owner's suggested evidence-based wording, and a
  NEW distinct unavailable wording (`listEmptyNone`) renders on BOTH sides
  when nothing could be read — an absence of readings is never worded as an
  absence of pressure. QA record
  `docs/QA/quirks-2026-10-25-balance-v4-fa-copy.md`.
- **Tests (balance.test.tsx)** — rewritten for v4: the SVG part inventory
  (beam body, beads with side accent fills, hub, one-path fulcrum, the
  reference as the ONLY line), the heading/subtitle/order assertions, the
  unavailable-empty-state split (case D), the LTR-signed rotation (case C
  negative), the lists-footprint classes, the RTL mirror and the
  divider-separated assessment, on top of the unchanged §4/§6/§13 logic
  suites and the merged-card integration.

### Verified

- Browser (temporary harness, deleted before commit): the bead height
  difference equals Lh × sin(angle) with 0.0u diff on every case (A 4°,
  B/D/G level, E 12°, H −4°) at both 1280 and 360 (scale 0.5385); zero
  horizontal overflow at 360/1280 in en + fa; keyboard Enter opens/closes
  the shared panel; zero console errors on a fresh session; VLM design
  review passes on the reworked geometry ("refined in its restraint",
  "well-proportioned", "balanced and professional") with the tilt-angle and
  green/red-token suggestions declined (owner's model and tokens).
- Gates: typecheck 6/6; 1,486 tests; lint 0 errors / 15 accepted advisories;
  copy:audit clean (2,152 entries, round-50); bundle budgets held (entry
  295.29/88.81; Insights lazy 625.46/149.74 vs 626/150).
- Screenshots: `docs/insights/screenshots/gold-balance/` — the v4 battery
  (A/B/C/D/E/G/H × en/fa × 1280/360 + 768 + dark + the banner variant) and
  the before-v3 capture.
## [2026-10-24d] — the «جزئیات بیشتر» white-space fix (the owner's post-deploy report; rebased over the 2026-10-25 balance-v4 round)

The owner reported that on the LIVE deployment clicking «جزئیات بیشتر» /
"More details" produced "just a white space with no more extra detail", and
that the prices block and the markets (index) section below it read as
collided. Reproduced on production (worker 7b939901): the bug shipped with
2026-10-24c itself and the original session's expanded-state verification
relied on DOM/aria assertions while the pixels showed the white space —
both live evidence screenshots from that round show the defect.

### Fixed

- **Why the panel vanished** — the card-body click-through button carried
  `h-full` (height:100%). The tile `article` is a stretched grid item, so
  once the disclosure opened, the grid row grew to fit card+button+panel,
  the article stretched to the row, and the body button then resolved
  `h-full` against the FULL stretched article height — pushing the
  disclosure trigger and the expanded panel BELOW the tile's box. The
  panel kept its DOM/aria state (why aria-expanded checks passed) but
  painted under the following cards (mobile: Silver/Brent tiles) or under
  the markets section (desktop) — later DOM siblings paint on top —
  leaving ~690px of white space and, on desktop, the "collision" with the
  markets section.
- **The fix** — the article becomes `flex h-full flex-col` and the body
  button drops `h-full` and keeps `grow`: it now only fills the space the
  disclosure leaves it, so the trigger and panel stay INSIDE the tile and
  the tile grows naturally with the open panel (spec 02 §5 — never clip to
  force equal heights). Equal tile heights across the row are preserved
  (grid stretch + `grow`), so nothing else about the anatomy changes.
- **Prices ↔ markets breathing room** — the owner also asked for more
  space between the prices block and the markets section: the section
  gains `pb-3`, taking the card-to-section air from 28px to 40px (scoped
  to the prices section only; the page-wide 28px rhythm is untouched).

### Verified

- Production build + real API (the 4173 harness): desktop 1280 EN —
  expanded panel renders INSIDE the Gold tile (element-from-point probes
  hit the panel's own rows), Silver/Oil/Bitcoin un-overlapped, clean
  spacing to the markets section; mobile 375 — panel inside the tile,
  Silver 10px below the grown tile, no horizontal overflow; fa RTL —
  Persian rows render, 40px air to the markets section; collapsed —
  four equal tiles, no spill.
- Gates: typecheck 6/6, lint clean, web tests 533 green, copy:audit
  clean (no new copy), bundle budgets held (entry 295.29/88.82,
  Insights 624.64/149.59).
- Evidence: `docs/evidence/2026-10-24d-disclosure-overflow-fix/`.
- Rebase note: this round was authored against production 7b939901 and
  rebased over the 2026-10-25 gold-balance v4 round (29418f7) before
  push/deploy; the balance round touches BalanceScale/MergedCard/copy
  dictionaries only — PricesBoard is untouched there and this fix applies
  cleanly on top.
- Deployed: pushed as `c8e0741` → currena-api worker
  `cc6f28e6-76dc-405f-a6ba-5fa7fd6adc9b`; re-verified LIVE on both
  currena.ir and the workers.dev domain (panel paints on desktop +
  mobile × en/fa RTL, 40px card→markets air, no overflow, zero errors;
  post-rebase gates: typecheck 6/6, lint clean, 1,506 tests, copy:audit
  clean, budgets held) — evidence
  `docs/evidence/2026-10-24d-disclosure-overflow-fix/live/`, deploy
  record in `docs/DEPLOY.md` §CURRENT DEPLOYMENT.

## [2026-10-24c] — the prices board cards re-drawn from the financial-asset-cards spec pack (rebased onto round-46 main)

The owner supplied the `financial-asset-cards-spec-pack.zip` (8 Markdown specs,
repo root); this round implements it on the four asset cards ONLY — no
page-level, provider, scoring or routing change. Supersedes the 2026-10-17b
owner-sketch anatomy while PRESERVING every statistic it introduced
(secondary stats move behind the disclosure, nothing is deleted).

**Rebase note (2026-10-24c):** the spec-pack session ran 2026-10-22 against
the owner's uploaded snapshot (`f50e723`); before push/deploy it was rebased
onto main @ round 46 (`0e411e6`) — the markets-view/copy/manifest/budget
work of the concurrent sessions is preserved byte-for-byte, the copy keys,
manifest entries and budget bump merged on top. Asset order, anatomy and
behavior unchanged by the rebase.

### Changed

- **Card anatomy (spec 02 §2)** — identity row (compact icon + plain name) →
  dominant price with the unit in its own small secondary line → per-card
  "as of" freshness → THE SEVEN-DAY TREND as the primary movement story →
  daily change (explicitly labelled, vs the previous stored observation) →
  a deterministic hedged briefing → «جزئیات بیشتر» / "More details"
  disclosure. The card body stays the whole-surface click-through to the
  details panel (the full chart, rule and source live there); the
  disclosure is a separate sibling button (aria-expanded/aria-controls,
  keyboard + touch, focus retained, 44px target, motion-safe chevron flip).
- **Seven-day sparkline (specs 02 §6 / 04)** — new `PriceSparkline.tsx`
  (sibling of the shared Sparkline, which is untouched): day-based x
  positions so calendar gaps render honestly, neutral ink, ≥2.5% amplitude
  honesty pad, LTR in both locales, dashed <2-point state, aria-label
  (asset + window + signed change). Data: `price-trend.ts` `window7d()` over
  the same stored history endpoint the details panel charts fetch — the
  reference anchors at the last observation at-or-before (latest − 7 days)
  within the 3-day tolerance, the SAME convention as the API's `change7d`,
  so the chart and the percentage share boundaries. No window ⇒ an explicit
  "Seven-day trend unavailable" line — never a fabricated flat chart.
- **Documented trend classification (spec 04 §5)** — `classifyTrend()`:
  <4 points ⇒ insufficient; |net| < 1% ⇒ range (calm) or mixed (traveled
  path ≥ 3%); |net| ≥ 1% ⇒ up/down ONLY when the net ≥ 50% of the traveled
  range (a −1% week inside a ±3% chop is honestly "mixed", a dominant
  crash-and-bounce is honestly "down"). Thresholds are constants with
  rationale; 16 new unit tests pin them.
- **Evidence-based briefings (spec 03)** — `briefingText()` templates from
  the dictionaries: observed movement + an explicit horizon hedge; Bitcoin
  volatility-aware ("fluctuated" ONLY on a genuinely mixed window); oil
  gets the drivers-evidence caveat; stale readings qualify the summary with
  "Data may be delayed."; no causes, forecasts, probabilities or advice.
- **«بالا» clarified** — the bare position word left the card face; the
  metric it stood for (the reading's percentile inside its own 10-year
  history — a LEVEL, not a trend) stays in the expanded section as "Price
  level vs 10-year range: High — top 20% of the decade" plus a note that it
  describes a level, not a direction.
- **Expanded details (spec 02 §8)** — 7d/30d/90d/6m/1y changes, 52-week
  range, the clarified level, the record high with date + basis,
  from-record distance, 200-day gap (now with its % sign — the {pct}
  placeholder receives the locale percent glyph), futures note, gold A$
  companion, Bitcoin ratios, source + as-of, and an "About these numbers"
  method note.
- **Asset order (spec 02 §10)** — `PRICE_ROWS` is now Gold → Silver → Oil →
  Bitcoin (the spec default; no user-configurable ordering exists — the
  full-data export rides the same list and stays consistent).

### Added

- `apps/web/src/components/insights/price-trend.ts` + `price-trend.test.ts`
  (16 tests) — the pure window/classification/briefing module.
- `apps/web/src/components/insights/PriceSparkline.tsx`.
- 41 copy keys × 2 locales (trend states, briefing templates, disclosure,
  detail rows, failure states — wording verbatim from spec 03's tables);
  manifest round-49 → `docs/QA/quirks-2026-10-22-financial-asset-cards.md`.

### Budget

- Insights lazy chunk consciously bumped on top of the round-46 line
  609.00/145.60 → 626.00/150.00 (measured on rebased main 624.65 kB raw /
  149.59 kB gz): the day-spaced sparkline + trend module + disclosure +
  82 locale strings the spec demands. Entry chunk untouched (295.29/88.82
  vs 296/89.5).

### Gates (re-verified on the rebased tree, main @ 0e411e6 + this commit)

- copy:audit clean (2,147 — the 41 spec-pack strings triaged round-49 +
  the ma200 ٪ glyph as a technical entry); 1,505 tests green (+16
  price-trend; web 533); typecheck 6/6; lint 0 errors/15 advisories;
  budgets held.
- Browser-verified against the production API (fresh profile, SW purged —
  the repo's own procedure): EN+fa × desktop/tablet-768/mobile-375/320,
  light+dark, disclosure keyboard-toggle (Enter, aria-expanded, focus
  retained), details-panel click-through preserved, no horizontal overflow,
  zero console errors.
- **Deployed** currena-api `6d6e1300-9af8-42fe-b42e-bd73ee865211` from
  `d952983` (pushed to main); live-served `Insights-DgGMrELI.js` sha256
  `fdd478e7…` byte-identical to the fresh build; live re-verified on
  currena-api.sedanama-ir.workers.dev AND currena.ir (4 cards in spec
  order, disclosure round-trip, fa RTL, 375 no overflow, zero errors) —
  evidence `docs/evidence/2026-10-24c-financial-asset-cards/LIVE-*.png`,
  deploy record in `docs/DEPLOY.md` §CURRENT DEPLOYMENT.

## [2026-10-24b] — the market view switch grows the weekly and monthly lenses (round 46)

The owner: *"Ok now they're back add monthly and weekly views of how
percentages changed as well. I mean for here: [the Insights page's market
view switch radiogroup]"* — the section's lens switch offered Today / 3
months / From 52-week high; round 46 adds the two missing durations.

### What changed

- **`chg1w` joins the contract** (`MarketEntry`, OPTIONAL like `chg1m`):
  last close vs the last close on/before the same date one week earlier —
  the same rolling-anchor rule chg1m (−30d) and chg3m (−90d) use. A stored
  row without it renders the honest dash (—), never a guess; `chg1m`
  (already live for the currencies rules) now also serves the monthly lens.
- **The view switch** reads **Today | 1 week | 1 month | 3 months | From
  52-week high** — ascending duration, the 52-week distance last; the
  default stays the NORMAL 3-month timeframe (owner round 44).
- **The full table** (desktop + the mobile list) gains a 1-week and a
  1-month column beside Today — the same lenses the switch offers.
- **The Tools-menu CSV** appends Week/Month columns at the END (the file's
  own stable-positional-API rule); a missing lens exports an empty field,
  never a guessed zero.
- **The full export** (MD/TXT/CSV/XLSX) carries the lenses on the EXISTING
  flat slots 7 (`change7d`) and 10 (`chg1m`) — no flat position moves.
- **Six new Persian strings** (views, table headers, CSV columns), triaged
  round-46 in the copy manifest — the fx table's span convention («یک
  هفته»/«یک ماه»), the markets table's «بازده» prefix, CSV's «(درصد)»
  suffix. copy:audit clean.

### The weekend backfill (why a new runner)

`markets-run` held all 16 rows (R5 same-date stability — the weekend
closes are identical to the stored ones), which would have left the
weekly lens honest-dashed until Monday's cron. The new one-off
`markets-backfill` script resolves every row with prev=undefined (fresh
live provider answers; the closes measured 0.000% from stored) and writes
through the SAME write-only-if-changed gate against the true stored
snapshot. The KV key is never deleted (no "being prepared" window).
Verified after write: 16/16 stored rows carry both lenses.

### Budgets (bumped with justification, never silently)

- Route payload 12 KB → **13 KB**: live after the backfill 12,225 B,
  realistic fixture 12,370 B — the old ceiling left 63 B of slack, so any
  future contract field or a 17th market would breach it.
- Insights lazy chunk 608.00 → **609.00 kB raw** (measured 608.78 raw /
  145.54 gz — gzip-neutral vs the 145.60 budget; the raw overage is
  localized label wording, not logic).

### Gates + verified

- Tests 1,489 green (+3: the buildEntry anchor/window ladder, the round-46
  copy parity, the full-export lens columns), typecheck 6/6, lint 0
  errors / 15 accepted advisories, copy:audit clean, T-15 (public)
  passed, bundle budgets held.
- Deployed `currena-markets` `0135290c` (crons now compute chg1w) and
  `currena-api` `36a4eeab` (serve path passes chg1w; fresh SPA rides it).
- Browser-verified on currena.ir/insights (EN + FA, 1280 + 375): the
  five-lens switch, tile values matching `GET /api/insights/markets` on
  every lens (e.g. Nikkei −5.4% weekly vs API −5.37; +2.2% monthly vs
  2.19), the 9-column table, Persian digits (−۵٫۴٪), zero console
  errors, scrollWidth === viewport at both widths; VLM visual QA clean.
  Evidence: `docs/evidence/2026-10-24b-market-lenses/`.

## [2026-10-18d] — the gold balance becomes a classic hanging-pan scale (the owner's v3 directive)

The owner: *"The latest implementation does not yet meet the intended
balance redesign."* Seven directives, all implemented (notes v3 section in
`docs/insights/gold-balance-card-notes.md`):

- **The illustration** is now ONE carefully-proportioned inline SVG
  (520×252 viewBox): tapered beam with rounded end knuckles, pinned
  pivot, tapered pillar on a two-step plinth, splayed chains to shallow
  pan dishes, dotted level reference — varied stroke weights, deliberate
  whitespace, the page's neutral secondary ink (7.98:1/7.7:1).
- **The dashed empty rectangle is gone**: both sides always draw their
  complete pans; a side with no qualifying factors gets a concise,
  evidence-based empty line under its list heading (2 new copy keys,
  round-48, QA record `docs/QA/quirks-2026-10-18-balance-v3-fa-empty-states.md`).
- **Factor cards are OFF the beam**: the beam carries only the aggregate
  tilt; the factors render in lists beneath their supportive/adverse
  side captions (the v2 caption row became the list headings), growing
  independently of the fixed-geometry illustration (no runtime
  measurement, no reserved-height arithmetic — the ResizeObserver is
  deleted).
- **Direction follows the model**: the beam tilts only for a directional
  verdict; balanced and unavailable states render level (net-0 and
  readable-0 rules unchanged — no financial model, weight, threshold or
  copy change beyond the two empty-state keys).
- **RTL mirrors the whole SVG** with one scaleX(-1) (pure geometry), so
  the for-pan lands inline-end and the visual rotation flips in the same
  transform; the lists mirror via the grid.
- Verified: 30 updated component tests; harness-measured tilt law
  exact for cases A–H (rim difference = Lh × sin(angle) to 0.1px); no
  horizontal overflow at 320–1280 in both locales; keyboard + panel
  behaviour unchanged; VLM design review positive. Screenshots:
  `docs/insights/screenshots/gold-balance/v3-*.png`.

## [2026-10-18c] — the deploy-record reconciliation (no code change)

The owner: *"It seems like you didn't push commit deploy yet."* — verified
end-to-end that this was a **documentation gap, not a missing deploy**: every
commit on main was pushed AND the newest code was already live; the 2026-10-18b
session had simply recorded its deploys in CHANGELOG + its evidence README
instead of DEPLOY.md, so the runbook's newest visible deploy entry was the
redesign's `d93bd0ba`.

- **Cloudflare-confirmed**: active currena-api version
  `9f66a82c-d0d4-494e-a3cd-524eac3b557b` at 100% (deployment `7c2a2526`,
  2026-10-17T16:51:58Z), preceded by `c476307f` — the public-restore lineage.
- **Byte-identical proof**: a fresh web build of main @ `4d339b5` yields
  `index-ChVkduNn.js` (sha256 `c06ff8db…`) + `Insights-BwhME956.js`
  (sha256 `cbb6da44…`) — hashes identical to the live-served chunks; the
  deployment matches main exactly.
- **Re-verified live** (agent-browser, fresh context): hero grayscale both
  themes, Australia-left/Global-right at 1280, markets section renders,
  tile rule round-trip EN+fa, fa RTL + Persian digits, no h-overflow at
  1280/360, keyboard `/` + Escape, zero console errors — evidence in
  `docs/insights/screenshots/economic-indicators-redesign/final-continuation/`.
- **DEPLOY.md** gains a "CURRENT DEPLOYMENT" section recording the whole
  lineage (redesign `d93bd0ba` → PWA fix → public restore `c476307f` →
  `9f66a82c`) so top-down readers see the true current state. No worker
  re-deploy needed: main and production are byte-identical.

## [2026-10-17f] — the Economic Indicators page re-drawn from the owner's real spec

The owner supplied the actual `economic-indicators-ui-spec.md` (the session
draft was authored from the kickoff message because the real file had not
arrived); it now governs the Insights page: grayscale structural foundation,
SELECTIVE severity inks, top-3 flagged + expand, fixed Global-right/
Australia-left card order in both locales, indicator ROWS, WCAG 2.2 AA,
viewports 320-1440. The spec file replaced the draft at the repo root.

### Changed

- **Hero region cards (VerdictBlock)** — restructured per spec §4/§5: the
  region NAME is now the card title (26-30px/700 desktop, 22-26px mobile)
  with the severity label (the verdict word, 15-17px/600-700) and the
  severity mark/scale (state artwork + four-step meter) sharing the title
  row; a concise "Why" line (the existing count line, red when flagged)
  sits directly below the heading with the existing how-computed tip.
- **Flagged indicators** — the tile GRID became indicator ROWS: leading
  severity symbol (warning triangle, alert red) at the inline-start edge,
  flexible text column (name + the generated rule line), primary value at
  the trailing edge; 12px radius, 1px border, white surface, >=72px rows
  that grow naturally. The flagged heading carries the FULL underlying
  count ("Needing attention now · 6"), the count never describes only the
  visible three. "+n more" / "Show fewer" keep the in-place reveal and now
  announce state (aria-expanded + aria-controls per list).
- **Verdict meters** — RESTORED the round-44 colored grading (the session
  draft's neutral ramp is retired): the real spec's §6 requires the meter's
  segments and color to match the existing severity logic, so the scale
  speaks the app's classification at every size (hero lg, gauge sm,
  question headers).
- **Hero card order** — FIXED desktop locations in BOTH locales per spec
  §5/§8: Global on the right, Australia on the left, never mirrored by
  direction (index.css order rules at >=1024px; below that the cards stack
  Global-first). The two-column hero now turns on only at lg — below 1024px
  two columns would make each card narrower than the spec's ~420px minimum.
- **Layout targets** — page title 24->32px at sm, header->cards gap
  12->28px, card padding 16/20/24px (md/lg), hero gaps 16/20/24px, page
  container capped at 1440px (xl:max-w-[1440px]); "View section" became a
  quiet card-footer link (redesigned placement, never deleted); the hero
  rows now pass the opener for focus-return on panel close (the existing
  PricesBoard/MoneyPanel pattern).
- Bundle budget: Insights lazy chunk 606.00/144.60 -> 607.00/145.20 kB
  (raw-neutral restructure, +3 B gz over the line; headroom so the next
  growth bumps consciously).

### Verified

- pnpm -r typecheck, lint (0 errors; 15 pre-existing warnings), test
  (1285 tests), copy:audit clean, build + bundle budget held.
- Browser: EN + FA at 320/375/768/1024/1280/1440 (no horizontal overflow
  at 320), expand/collapse, DetailsPanel Escape + focus-return, colored
  meters, Persian digits, RTL logical edges.

## [2026-10-17e] — the gold card's balance visual (owner spec)

The owner's `docs/insights/gold-balance-card-spec.md`: the gold signals
card's grouped driver list ("Works against" / "Sitting neutral") becomes
a BEAM BALANCE a visitor reads in five seconds — which way the
conditions lean for gold, and how many drivers could not be read. Built
on the branch `feature/gold-balance-card` per spec §15.3 (not merged, not
deployed yet).

### Added

- **`signals/BalanceScale.tsx`** — the reusable balance component (takes
  a list of drivers, applied to the GOLD driver list only): the verdict
  line (word + the owner's up/down zigzag icon + the " · "-joined count
  line, zero parts omitted), the beam/pivot/strings graphic strip
  (`role="img"` whose label states the result — the interactive pans are
  siblings of it so the blocks stay real buttons), two pans of blocks
  (`for` at the inline-start end, `against` at the inline end; heavier
  side DOWN like a real scale; angle = |net|/total × 14° with a 3° floor
  and a 30 px pan-drop cap whose angle is re-derived so the pans follow
  the beam ends exactly; only the beam rotates — text stays upright;
  500 ms ease, `motion-reduce` disables it; RTL flips the rotation
  sign), the shared detail panel (blocks below ~900 px tap to open their
  existing explanation sentence, one open at a time; at ≥900 px the
  sentence lives inside the block; tray chips open it at every width),
  and the two trays — "Neutral" (quiet chips) and "Couldn't read"
  (dashed chips + the existing clock icon), empty trays hidden, never on
  the beam. Pure helpers exported + unit-tested (`balanceTilt`'s tilt
  rule, the state map, the count line, the pan columns).
- **`signals.balance` copy** — 13 keys × 2 locales (spec §13 verbatim;
  fa uses the existing site terms «قابل ارزیابی نیست»/«خنثی» per §13).
  Manifest round-48 (13 NEW processed, reference = the spec); the
  retired group headings (`sideSupportive/sideAgainst/sideNeutral/
  sideUnknown`) removed from both dictionaries and the manifest.

### Changed

- **`MergedSignalsCard`** — the three grouped driver lists are replaced
  by the balance; the C12 gold-high-yields banner rides the balance's
  §5.2 slot (text unchanged); the Price footing strip moves below the
  trays behind a divider (§9 — footing is not a driver and is never
  counted); the silver-only list and the outlook chip strip untouched.
  No signal logic, threshold, data source or explanation text changed
  (§16); no new dependency, API call or KV access (§2.4/§2.5).
- **Bundle budget** — the Insights lazy chunk budget bumps
  604 → 606 kB raw / 142.8 → 144.6 kB gz: the BalanceScale component +
  13 copy strings × 2 locales, minus the removed group markup. Measured
  605.31 kB raw / 144.53 kB gz. Entry chunk untouched (295.15/88.76).

### Verification

- Gates: 1,480 tests green (+25 balance tests), typecheck 6/6, lint
  0 errors/15 advisories, copy:audit clean, budgets held.
- Spec §14 loop: all five tilt cases (A–E) screenshotted at ~360 px and
  ~1280 px in EN and FA plus case A at ~768 px
  (`docs/insights/screenshots/gold-balance/`, 24 shots incl. the live
  production smoke via a read-only currena.ir forwarder — the live state
  matched case A exactly: 1 against, 3 couldn't be read); no horizontal
  scroll at 320 px; blocks/chips ≥ 44 px; tab order verdict → for →
  against → trays → footing; Enter/Space open the panel; reduced-motion
  kills the animation; console clean; no new network requests.
- Full detail: `docs/insights/gold-balance-card-notes.md`.

## [2026-10-17d] — the prices polish: sign inks, bigger titles, the hero glitch, N2 retired

The owner's four-point follow-up: signed percentages in red/green ("for
example" a prices-board change row); bigger, bold, clear section titles
in the prices board AND the metal chips ("silver gold must be written
much larger"); EN titles capitalized ("so silver is wrong, write
Silver. Be professional."); the hero's big-move line "seems glitchy"
(the fa fed-rate mover rendered «… آمریکا واحد درصد ۳۰ روز +۰/۲۵»);
and the short disclaimer + «درباره این داده‌ها ↧» button removed or
relocated to the bottom.

### Added (`config/display.ts`)

- **`changeToneClass`** — the owner's sign inks as one helper: positive →
  `--color-status-normal` (Carbon Green 50), negative →
  `--color-status-alert` (Carbon Red 60), zero/absent neutral. Applied to
  the four prices-board change rows, the 6-month/1-year fact bullets and
  the hero mover's value.
- **`formatChangeParts`** — the signed number and the WORD unit split:
  percents bind tight inside the number island ('+3.63%'), word units
  ('pts' / «واحد درصد») ride OUTSIDE as their own element.
  `formatChange` delegates to it — its composed output is byte-identical
  (pinned by the existing tests).

### Fixed

- **The hero glitch, structurally** — the big-move line forced
  «+۰٫۲۵ واحد درصد» into one `dir="ltr"` island, and the bidi algorithm
  scattered the RTL word unit: the line read «… آمریکا واحد درصد ۳۰ روز
  +۰/۲۵». Now the number keeps its own ltr island and the unit rides the
  next element: fa «نرخ سیاستی فدرال رزرو آمریکا +۰٫۲۵ واحد درصد ۳۰ روز
  …», EN "… policy rate +0.25 pts 30-day …".
- **EN title case** — `signals.metals` now `{ gold: 'Gold', silver:
  'Silver' }` (chips, merged-card rows, collapsed lines, the export Name
  column). All other EN display names audited — already capitalized.

### Changed

- **Titles bigger** — prices-board tile names 14→18px bold primary ink;
  metal chip names 14→20px bold primary (the price stays the lighter,
  quieter end of the header row — the Task-15 decree intact).
- **N2 retired from the hero** — the short disclaimer line and the
  about-jump button no longer sit under the hero: the page-bottom About
  section carries the full text, the global footer already carries the
  app-wide non-advice disclaimer, and the top nav chips still jump to
  About. `onJumpAbout` stays (the verdict blocks' alert cards use it).

### Workflow

- NO fa string changed — `pnpm copy:audit` clean without a manifest
  touch. Gates green: 1,455 tests, typecheck 6/6, lint 0 errors/15
  advisories, budgets held (entry 295.15/88.76 gz; Insights lazy
  597.50/142.51 gz). Deployed currena-api
  `8caff087-39fd-4026-b6ad-3274fa5ff77b`; served chunks sha256-identical;
  production browser-verified (sign colors sampled live, title sizes,
  "Gold" capitalized, the mover order fixed in both locales, `role=
  "note"` ×0 at the page top, 375 scrollWidth === 375, zero errors).
  Evidence: `docs/evidence/2026-10-17d-prices-polish/`.

## [2026-10-17c] — the Persian dollar convention

The owner's convention: "in farsi only say دلار not دلار آمریکا … only
mention dollar nationality when it's for australia or canada."

### Changed (copy-only — no data, scoring or formatting logic)

- **USD reads «دلار» everywhere** — 113 strings in `insights-copy-fa.ts`
  plus `currencies.USD` in `fa.ts`: indicator values («۱۱۳٫۹۶ دلار»),
  the board tiles' unit lines, 52-week-range tails, the metals chips'
  muted price («۴٬۱۶۵ دلار»), the fx rows («قدرت دلار»), the converter
  picker («USD · دلار»), the share line, the dollar-index copy. The
  unqualified «دلار» is what Persian financial usage already means.
- **Nationality reserved** — «دلار استرالیا» (AUD, 86 served occurrences)
  and «دلار کانادا» (CAD, 2) keep their qualifiers; cents untouched
  («۶۲ سنت آمریکا» — the rule speaks about دلار). NZD also drops its
  qualifier per the rule's second clause (the picker keeps the code:
  «NZD · دلار»; flagged for the owner — one-line revert in
  `fa.ts` `currencies.NZD` if unintended).
- **EN untouched** — US$ / US Dollar stay as-is.
- Comment-only examples updated so the source no longer models the old
  phrase (VerdictMeter, PricesBoard, config/display, lib/live-rate).

### Copy workflow

- Manifest round-47: 114 keys re-triaged `processed` against
  `docs/QA/quirks-2026-10-17c-fa-dollar-convention.md`; `pnpm copy:audit`
  clean (2,090 entries).
- Tests re-pinned to the new strings (live-rate, fx-presentation,
  insights, fx-v13). Gates green: 1,455 tests, typecheck 6/6, lint
  0 errors/15 advisories, budgets held — the Insights lazy chunk SHRANK
  599.38 → 597.79 kB raw (the dropped qualifier).
- Deployed currena-api `c970f556-0070-4fc9-a7ab-98e653461857`; served
  chunks sha256-identical to the build, «دلار آمریکا» ×0 in both served
  bundles; production browser-verified (fa home/insights × desktop/375,
  EN regression, zero errors). Evidence:
  `docs/evidence/2026-10-17c-fa-dollar-convention/`.

## [2026-10-17b] — the prices board cards re-drawn from the owner's sketch

The owner's five-point directive for the four-tile prices board
(Bitcoin / Silver / Gold / Brent): "1. Picture next to Unit name and price
2. Daily / Weekly / Monthly/ Quarterly Percentages 3. Descriptions and
verdict 4. some more meta data facts and percentages (must be in bullet
point) 5. very small text showing update time." — with a hand-drawn card
sketch (price + "Price per ounce" caption beside the artwork at the top's
far end; four stacked percentage lines; a big "Description" heading; bullet
rows; very small as-of).

### Changed (`PricesBoard.tsx` — one rebuilt anatomy, mobile AND desktop)

- **Header row: the artwork beside the unit name and price** — the big
  digits at the start (the fa unit drops to its own small line UNDER the
  digits so every fa tile has the same price-block height; EN keeps the
  merged `US$4,165`), the indicator name in its fixed two-line slot, the
  tinted `PriceIconBox` (96px mobile / 72px desktop) at the row's far
  end. RTL mirrors the sketch automatically. The stacked-artwork face
  (R29r2) retires.
- **FOUR percentage rows** — daily / weekly / monthly / quarterly, one per
  line, labels at the start and values end-aligned (they share one edge in
  every tile), the quiet "—" when a window does not exist. Weekly /
  monthly / quarterly come from the feed (`change7d/change30d/change90d`,
  production-verified present on all four tiles); the DAILY row is derived
  from the stored history.
- **Description + verdict** — a "Description" label row whose far end
  carries the price-position verdict word (cheap/normal/expensive, the
  R31 status ink) above the existing hedged consequence line.
- **The fact BULLETS** (`role="list"`, `data-price-facts`) — the derived
  stats first (6-month change, 1-year change, 52-week range), then the
  tile's context lines (the futures note, gold's A$ companion, Bitcoin's
  ratios, the 200-day gap, the record distance). A fact that cannot be
  measured stays OFF the card; "as of" drops to 10px tertiary ink pinned
  with `mt-auto` so the four footers align.
- **New `price-stats.ts`** — the client-side derivation module with the
  R30 honesty rules tightened: every number comes from the stored history
  ALONE; a window's reference is the nearest stored point within ≤3 days
  (a sparse series yields absent, never a stretched number); the last
  stored point can no longer be its own reference (the old derivation
  could fabricate a 0% change out of a missing window — caught by the new
  tests); the "52-week range" is only NAMED when the window really spans
  ≥300 days; zero baselines yield absent, never Infinity. +9 tests.
- **Copy** — 9 new keys in both dictionaries (`priceChangeDaily/Weekly/
  Monthly/Quarterly`, `descriptionLabel`, `stat6mChange`, `stat1yChange`,
  `stat52wRange`, `rangeJoin`); `days7`/`days30` untouched (AlertCard,
  HeroBlock and CompactRow still speak them). Manifest round-46: 9 NEW
  entries referenced to `docs/QA/quirks-2026-10-17-prices-card-redesign.md`.
  No data/scoring/API change; the metals analysis chips (Tasks 15–17) and
  the money panel untouched.

- Gates: copy:audit clean (2,090 entries); full workspace tests 1,455
  green (web 485, +9 price-stats); typecheck 6/6; lint 0 errors/15
  accepted advisories; bundle budgets held — entry 295.15/88.76 kB gz;
  Insights lazy 599.38/142.60 gz (+2.78 kB raw, +0.77 gz under the cap).
- Deployed currena-api `0652db45-3fc2-418f-87c2-bb06caa51e5c` (SITE_MODE=
  public untouched; currena-markets untouched `9b5ff7e0`).
- Production browser-verified (agent-browser, SW precache purged first —
  the Task-17 lesson): served chunk `Insights-E8NrMws9.js` byte-identical
  local == production (sha256 `f3a0d27c…`); EN desktop — the sketch
  anatomy on all four tiles, gold rows `Daily −0.13% / Weekly −1.22% /
  Monthly −5.08% / Quarterly +3.63%`, 6 fact bullets incl. `52-week
  range: US$3,961 – US$5,318`, as-of 10px; fa RTL — icon mirrored to the
  top-left, unit `دلار آمریکا` under the digits, «محدودهٔ ۵۲ هفته: ۳٬۹۶۱
  تا ۵٬۳۱۸ دلار آمریکا», verdict «بالا» red at the توضیحات heading's end;
  mobile 375 scrollWidth === 375 in BOTH locales (icon 96px, same
  anatomy); clicking a tile opens/closes the details panel; zero
  page/console errors; `/api/insights` → 32 readings (gold-aud honestly
  absent — no A$ bullet this snapshot); the metals conditions strip
  untouched.
- Evidence: `docs/evidence/2026-10-17-prices-card-redesign/`.

## [2026-10-21] — the gold/silver outlook speaks the owner's seven states (the EN/fa drift bug)

The owner's bug report: for gold and silver the verdict slot said EN
"Works against" but fa «شرایط موجود با الگوی معمول هم‌خوانی ندارد» —
"these are not same thing." Confirmed: the two locales shared the
`signals.verdictDown` key but not a meaning (the fa string was a leftover
of the old "pattern conformance" framing). Fixed by adopting the owner's
**"Gold Market Outlook — Complete State List"**: SEVEN states with the
owner's own bilingual sentences, so one state machine feeds both locales
and drift is structurally impossible.

### Changed (`signals/verdict.tsx`, `Signals.tsx`, dictionaries, `full-export.ts`)

- **New seven-state outlook classifier `outlookOf`** over the same
  condition tally (gold 5 / silver 6 conditions): strong-bullish /
  strong-bearish at the card lean's OWN strong bar (`LEAN_STRONG = 4`,
  now exported from `@currena/insights` — one strength definition per
  card); bullish / bearish on a majority of directional conditions;
  mixed on an equal split (the indicators disagree); neutral when all
  readable conditions sit neutral (no directional bias); **range-bound**
  only with affirmative quiet-price evidence (|30-day speed| < 2% AND the
  price in the typical band of its 10-year range) while the driver split
  stays within one — the owner's distinctions (Neutral ≠ Range-Bound ≠
  Mixed) are honoured mechanically, not by renaming.
- **The old `up/down/flat` words are retired** — `verdictUp`
  ('Supports' / «حمایت‌کننده»), `verdictDown` ('Works against' /
  «شرایط موجود با الگوی معمول هم‌خوانی ندارد») and `verdictFlat`
  ('Mixed' / «ترکیبی») are gone from both dictionaries and their three
  manifest entries pruned; `verdictNone` («هنوز نمی‌توان نتیجه‌گیری کرد»)
  stays for the nothing-readable edge.
- **The owner's verbatim sentences** land as `signals.verdictStates`
  (7 states × gold/silver, EN + fa — the gold strings exactly as the
  owner wrote them, silver mirrors) and `signals.verdictStateNames`
  (7 short names — Strong bullish/Bullish/Neutral/Range-bound/Bearish/
  Strong bearish/Mixed signals; fa: صعودی قوی/صعودی/خنثی/محدوده‌ای/
  نزولی/نزولی قوی/نشانه‌های مختلط) for the collapsed line. The strip
  heading becomes "Outlook"/«چشم‌انداز» and the collapsed template
  "Outlook: {verdict}"/«چشم‌انداز: {verdict}» — 21 new + 2 changed
  manifest entries, round-45, referenced to
  docs/QA/quirks-2026-10-21-outlook-states.md (the owner's table recorded
  verbatim).
- **The sentence gets its own line in the chip** — the 2026-10-20 sketch's
  header (icon box · name · lighter price) stays, but a full sentence
  cannot live in that narrow column (it wrapped into a 4-6-line staircase
  at 375px — caught in production verification of the first deploy,
  `a5d2f793`): the outlook sentence now rides a full-width line between
  the header and the chart, zigzag icon leading, floored two-line slot
  keeping the two desktop chips' charts on one baseline (the round-34
  rule). One anatomy for mobile AND desktop, both locales.
- **`verdictTone`/`VerdictIcon` extend to the seven states** — the
  bullish family keeps the green ink + up zigzag, the bearish family the
  red ink + down zigzag (colour never rides alone), and the calm states
  (neutral/range-bound/mixed, plus unreadable null) share the dash in
  the muted ink.
- **The signals CSV header decouples** from `verdictTitle` (the row's
  status value is the checklist lean, not the outlook) — it now uses the
  generic `ui.csvColStatus` like the other sections.

### Unchanged (deliberately)

The condition checklist and its side words (Supports / Works against /
Sitting neutral), the lean words and counts, the data/scoring engine, the
API shape, the prices board and every other section.

### Gates

`copy:audit` clean · full workspace tests green (1,446 — +15 new outlook
tests pinning the mapping edges, the owner's verbatim strings and the
retired keys' absence) · typecheck 6/6 · lint 0 errors/15 accepted
advisories · budgets held (entry 295.15/88.76 kB raw/gz vs 296/89.5;
Insights lazy 596.60/141.83 vs 604/142.8 — +0.53 kB gz for the 28
authored sentences).

### Deploy + production verification

Deployed currena-api `d0d28c3f-f0a9-4619-b269-8f7337d9daa9` (SITE_MODE=
public, cron, KV intact; currena-markets untouched `9b5ff7e0`). Served
Insights chunk `Insights-DlDkQ-3K.js` byte-identical to the local build
(sha256 1d0778c5…); the old mismatched fa sentence — 0 occurrences in the
served bundle. Live browser verification (agent-browser, fresh
SW-purged loads): live data produced `bearish` for both metals and BOTH
locales render the same state — EN "Outlook: Signs point to a potential
decline in gold/silver prices." with red zigzag + muted prices US$4,165 /
US$57.27; fa «چشم‌انداز: نشانه‌ها حاکی از احتمال افت قیمت طلاست./…نقره
است.» RTL-mirrored with Jalali ticks; collapsed "Outlook: Bearish" /
«چشم‌انداز: نزولی»; 375px scrollWidth === 375 both locales; the prices
board (4 tiles) and condition checklist untouched; zero page/console
errors. Evidence: docs/evidence/2026-10-21-outlook-states/.

## [2026-10-20c] — the gold/silver analysis charts grow the 10-year view (the owner's request)

The owner, one message after the verdict-chip redesign shipped: **"Add 10
year View of the gold and silver price as well."** — the metals' Estimation
chips ("Conditions right now") offered only Quarter · 1 year · 5 years; the
decade was missing although the history feed already serves the complete
10-year daily series for both metals (2514/2513 points, 2016-10-18 →
2026-10-16 — verified on production before touching anything).

### Changed (`TrendChart.tsx`, `signals/verdict.tsx`) — UI-only

- **`TrendRange` grows `'10y'`** (3653 days — the details panel's exact
  10-year window incl. leap-day slack). `TREND_RANGE_COPY_KEY` maps it to
  the EXISTING `range10y` key ('10 years' / «۱۰ سال») — zero new strings,
  no manifest change.
- **New optional `ranges` prop** on the shared `TrendPanel` (defaults to
  the old Quarter · 1y · 5y list) — only callers that opt in grow the
  decade chip. `TREND_RANGES` (the full ordered list) is now exported as
  the canonical order/test seam.
- **`MetalTrendChart` passes `ranges={['quarter','1y','5y','10y']}`** —
  both metals' analysis chips offer the decade; `StripRange` grows `'10y'`.
  The chip is gated by the same ≥2-plottable-points rule as its siblings.

### Unchanged (deliberately)

The money panel's mini charts keep exactly three chips (Quarter · 1 year ·
5 years) — the owner asked for gold and silver specifically. The details
panel's HistoryChart already had its own 10y zoom. No copy keys, no data,
no scoring, no API change.

### Gates

`copy:audit` clean · full workspace tests green (1,431) · typecheck 6/6 ·
lint 0 errors/15 advisories · budgets held (entry 295.15/88.76 gz;
**Insights lazy 593.58/141.30 gz**, +0.07 kB for the fourth chip). Deployed
currena-api `4e8a54e0-fda4-4ce7-bc1e-9ba245c1bfc9` → production
browser-verified: EN desktop — both chips show Quarter · 1 year · 5 years ·
**10 years**, decade ticks Oct 2016 → Oct 2026, deltas **+230.3% 10 years**
(gold) / **+225.6% 10 years** (silver), muted header prices intact; money
panel still three chips; EN mobile 375 identical, no overflow; fa RTL —
«۱۰ سال» chip, Persian-digit deltas, Jalali X ticks; zero page/console
errors. Evidence: `docs/evidence/2026-10-20-metals-10y/`.

## [2026-10-20b] — the gold/silver verdict chips become analysis cards (the owner's sketch)

The owner drew the chip UI for the gold and silver "Conditions right now"
strip: boxed artwork in the corner, the name + verdict beside it, the PRICE
in a lighter ink ("the price is already mentioned once in upper section.
the emphasis must be on the TREND, not the price necessarily"), and ONE big
chart filling the rest of the card — "DO THE SAME FOR MOBILE VIEW."

### Changed (`signals/verdict.tsx`, `signals/MergedCard.tsx`)

- **Header row** (replaces the 96/128px artwork column): `MetalIconBox` —
  the metal artwork in a small tinted box (56/64px; gold brand-gold tint,
  silver soft tint) · name (bold, primary) + verdict word with its direction
  artwork (verdict ink) · the current price at the far end in the MUTED
  secondary ink (tabular, nowrap) — the price already leads the prices
  board; here the trend speaks.
- **The chart is the body**: `MetalTrendChart` gains `plotHeightClass` and
  opens at **h-40 mobile / h-52 desktop** (was h-20); the side-split layout
  (`sm:w-40`, `sm:border-s`, `min-h-[136px]`) is gone — ONE anatomy for
  mobile AND desktop, exactly as the owner asked. Range chips + window
  delta unchanged. The verdict word keeps its floored two-line slot (the
  round-34 alignment rule survives by structure).
- **Price source**: MergedCard computes each metal's display price from the
  SAME snapshot readings (`formatIndicatorValue`), passes
  `prices={{ gold, silver }}`; honest absence → nothing rendered.

No copy changes, no data/scoring change.

### Gates

`copy:audit` clean · workspace tests **1,431 green** · typecheck all · lint
0 errors/15 advisories · budgets held (entry 295.15/88.76 gz; Insights lazy
593.51/141.27 gz, +0.9 kB raw). Deployed currena-api
`757cb15b-45ae-4a61-8f4a-d808a515968d`→ production browser-verified: EN
desktop plot 208px with muted header prices; mobile 375 identical anatomy,
no overflow; fa RTL mirrors the sketch (icon right, muted price left, Jalali
ticks); prices board untouched; zero page/console errors. Evidence:
`docs/evidence/2026-10-20-verdict-chip-redesign/`.

## [2026-10-20] — the "Know before you buy US shares" box removed (the owner's direct request)

The owner pasted the exact rendered `<details>` element (fa:
«پیش از خرید سهام آمریکا بدانید» — the collapsed FX/fees/disclaimer notes box
on the Insights page) with one instruction: **"Remove this entirely."**

### Removed

- **`UsSharesNotesBox`** (`apps/web/src/routes/insights-sections/UsSharesNotes.tsx`)
  — the Step 3 §7.1 collapsed info box, rendered unconditionally on Insights
  since the 2026-10-16 rebuild, is gone: component deleted, the
  `<UsSharesNotesBox copy={copy} />` render + import removed from
  `Insights.tsx`, and the section comment now dates the owner-requested
  removal so it is never "helpfully" resurrected. `UsSharesAudBox` (the
  L2-03 AUD view — a different box in the same file) is untouched.
- **Copy keys retired** in both dictionaries (`insights-copy-en.ts`,
  `insights-copy-fa.ts`): `usSharesBoxTitle`, `usSharesFxLine`,
  `usSharesFeesLine`, `usSharesDisclaimer` — en↔fa parity intact.
- **`docs/localization/persian-copy-manifest.json`**: the four matching
  entries pruned (REMOVED findings fail `pnpm copy:audit`).

### Unchanged (deliberately)

No data, scoring, projection, or behaviour change — the box was copy-only
and rendered identically in both site modes. The world-markets/AUD boxes,
the prices board (2026-10-19e) and the sparkline fix (2026-10-19f) are
untouched.

### Gates

`pnpm copy:audit` clean · web tests 461/461 (34 files; full workspace green)
· typecheck 6/6 · lint 0 errors (15 accepted advisories) · budgets held —
the Insights lazy chunk **shrank** to 592.61 kB / 141.14 gz (was
594.68/141.60; budgets 604/142.8), entry untouched 295.15/88.76.

Deployed currena-api `e6d18811-46ae-4f27-890a-6a1f63b90cd1`; production
verified: served Insights chunk carries **0** occurrences of the box copy,
prices board + 32-reading projection intact. Evidence:
`docs/evidence/2026-10-20-remove-us-shares-notes/`.

## [2026-10-19f] — the sparklines draw honest trends (the owner's screenshot report)

The owner (screenshot of the USD→IRT converter card): "The graph seems
irregular and like a placeholder or buggy." — a violent, perfectly regular
sawtooth where a trend should be.

### Root cause (production forensics, not guesswork)

- `/api/history?source=tgju` held 240/240 DISTINCT generations over ~24 h:
  TGJU re-quotes jitter on nearly every 6-minute tick (median 0.01–0.04%,
  p90 ~0.12%; EUR/GBP/CHF changed on 229–235 of 239 ticks), so exact-value
  dedup recorded noise nonstop and the window never spanned more than a day.
- The USD quote itself bobs between two levels ~0.375% apart (155
  transitions, 38 clean a-b-a patterns — a genuinely served quote).
- The UI drew raw points min-max-normalized (last 40 on the converter card,
  all 240 in the popup and /live-rates) — sub-percent noise filled the full
  plot height: the sawtooth. The real +3.1% window trend was invisible.

### The fix (three coordinated layers)

- **Record deadband (`apps/api/src/history.ts`)** — a generation appends
  only when a rate moves ≥ `HISTORY_RECORD_DEADBAND` (0.05%) vs the last
  RECORDED level (hysteresis; rate-set changes always record). Genuine
  drift records at its first crossing; jitter never accumulates into a
  record. KV write budget drops with it.
- **Drawn-line aggregation (`apps/web/src/lib/live-rate.ts`)** —
  `bucketMean(series, TREND_BUCKETS = 48)`: only the DRAWN polyline is
  bucket-averaged; trend chips, ranges, check counts and the
  delta-vs-previous stay RAW. Applied at all three call sites
  (LiveRateLine, ResultPopup, LiveRates board) — the drawn window now
  spans the whole recorded history (days), not the last 40 ticks.
- **Honest amplitude (`apps/web/src/components/Sparkline.tsx`)** — the
  plot domain pads to ≥2.5% of the series' mid-level (always containing
  the data), so sub-noise wiggles render proportionally calm and real
  trends still fill the plot.
- **One-time KV prune** (post-deploy, KV REST) — the stored window
  re-filtered with the same deadband: tgju 240 → 188 gens (USD 259,600 →
  267,900 across the window — the genuine rise now visible immediately);
  frankfurter already clean.

### Gates + deploy

- Tests 1,431 green (+12: deadband ×5 incl. hysteresis; bucketMean ×5;
  Sparkline amplitude ×3 — calm band never touches the edges, a ≥2.5%
  move still fills the plot, drift+noise stays visible). Typecheck 6/6;
  lint 0 errors (15 accepted advisories); copy:audit clean; budgets held
  (entry 295.15/88.76, Insights 594.68/141.60).
- Deploy currena-api `ed79e2cc-fb2f-44ce-bcad-00d73dc57eed` (cron, KV,
  SITE_MODE=public untouched). Production browser verification: the
  owner's exact card (fa, 375 px) now draws a smooth rising line; popup
  "TREND: LAST 189 UPDATES · +3.2% · low 256,895 · high 267,900";
  /#/live-rates cards all calm; zero console/page errors; no 375 px
  overflow; the Insights prices grid (2026-10-19e) untouched.
- Evidence: `docs/evidence/2026-10-19f-sparkline-honesty/` (before
  screenshot + pre-fix history analysis + pruned-history capture + five
  production screenshots + README).

## [2026-10-19e] — the prices board returns to public mode (the owner's directive)

The owner: "Still there aren't GOLD BITCOIN SILVER price, like it used
to. please read previous version you will findout there was a dedicated
nice section with images for it." — this resolves the decision left open
by the 2026-10-19d investigation (recovering the four price tiles was
listed as an owner choice).

### The restoration (one mechanism, honest trail)

- **The images never left** — production still serves
  `/assets/icons/{oil,gold,silver,bitcoin,copper}.png` and the
  PricesBoard code ships in the live bundle; the tiles were DATA-starved
  (the Oct-19b licence-cautious hide filtered their readings out of the
  public projection).
- **`scripts/generate-indicators-registry.ts` gains
  `OWNER_PUBLIC_DISPLAY_OVERRIDE`** for exactly {brent, gold-usd,
  silver-usd, btc-usd}: it lifts ONLY the public-display disposition of
  the E-01/LR-02 worst-leg walk, and appends a dated evidence note to
  every card (the underlying licence facts stay verbatim; the Yahoo
  legs stay in the ENGINE — the private page is unchanged; the world
  boards markets/fx and all other non-'yes' verdicts stay hidden).
  Explicitly recorded as an owner directive, NOT a terms
  re-verification — the quarterly licence review re-confirms it.
- **Regenerated artifacts**: hidden set 24 → 20
  (data/indicators.json, data/indicator-audit.json,
  data/site-mode-overrides.json — all cross-checks stay consistent by
  construction).
- **Tests**: the LR-02 hidden-history fixture moves brent → vix (still
  Cboe-hidden); NEW pin — the four owner-directive tiles must never be
  re-hidden by a future generator change. Suite 1,419 green (+1).
- **Gates**: tests 1,419 (core 191 · scraper 67 · insights 462 ·
  markets 13 · api 233 · web 453), typecheck 6/6, lint 0 errors / 15
  advisories, copy:audit clean, budgets held (entry 294.78/89.39 vs
  296/89.5; Insights lazy 594.68/142.02 vs 604/142.8), T-15 PASSED in
  SITE_MODE=public (20 hidden + the boards declared).
- **Deployed**: currena-api **`d40211f9-970b-4756-970c-8424f6062b20`**
  from the restore commit; the public projection REBUILT from the
  stored snapshot without re-fetching (52 → 32 public-ok readings; KV
  2 reads / 1 write).
- **Production verified**: /api/insights → 32 readings with brent
  109.13, gold 4,164.70, silver 57.27, bitcoin 81,180.14 (US$); the
  live `#insights-prices` section renders all four tiles WITH their
  images; zero console/page errors; 375 scrollWidth === 375. BONUS:
  the money panel's "Petrol and transport" row returned with brent
  ("Becoming more expensive — US$109.13 Oil price (Brent)") — the
  data-driven gap the 2026-10-19d investigation diagnosed.
- Evidence: docs/evidence/2026-10-19e-prices-restore/.

## [2026-10-19d] — the missing-items investigation + the ingest watchdog

The owner: "Some items are gone, for example the grid that shown GOLD -
Silver - brent oil and bitcoin price. also many items have no data / or
not defined / or waiting. investigate whether it's api problem, quota or
what."

### Verdict (investigated, not guessed)

- **API problem? No.** The last ingest (Oct 16 09:06) succeeded 50/50
  sources with ZERO failures; both the private and public snapshots
  carry ZERO stale/unavailable readings. Quota? No — push-triggered CI
  kept running throughout.
- **The prices grid (gold/silver/brent/bitcoin) is GONE BY DESIGN** —
  the PUBLIC projection's licence hiding: all four tiles' sources carry
  `public_display_ok: no` in the indicator audit (EODHD/Yahoo terms do
  not allow public display), so their readings are absent from
  `insights:snapshot-public` and `PricesBoard` renders nothing
  (`rows.length === 0 → return null`). The world boards (/markets, /fx)
  are hidden the same way.
- **The "no data / not defined" items are the hidden gauge members** —
  with 24 of 51 indicators hidden, two GLOBAL question gauges lose
  every member (Market stress 0/4, The US dollar 0/2 → the honest
  "not enough data to read" group), and four more read partially
  (borrowing-costs 5/8, prices-heat 1/3, growth-health 3/6,
  au-trade-currency 1/3).
- **The money-panel shift is DATA-driven, not licence-driven** — money
  rows show only attention/unusual areas. Petrol/transport's drivers
  are `['brent', 'au-petrol-yoy', 'audusd']`: brent + audusd are
  licence-hidden publicly AND (the decisive part) ALL of petrol's
  remaining drivers are calm right now, so the row is absent on BOTH
  the private and public pages today (verified by computing
  `moneyPanel()` on both snapshots — identical rows: homeLoan, savings,
  shop, jobs). Employment appears because `au-unemployment` +
  `au-wage-growth` are BOTH currently `warning` — and both are
  public-ok, so the row survives the projection.

### The REAL outage found underneath (and fixed)

The daily `insights-ingest` schedule had silently STOPPED firing after
Oct 16 (zero attempted runs for three days; the 04:20 UTC cron had
already been firing ~4h45m late before the full stop — GitHub-side
schedule delays/skips). Data was three days stale with only the /admin
staleness pill as a signal.

### Added

- `apps/api/src/ingest-watchdog.ts` — the Worker-side self-heal: the
  cron's :40 hourly rung reads `insights:status`; a snapshot older than
  26 h re-dispatches the insights-ingest workflow via the GitHub API.
  Nudges bounded to one per 6 h (`insights:ingest-nudge:v1`); a missing
  `GH_INGEST_DISPATCH_TOKEN` secret is an honest logged no-op; every
  failure path is caught. Healthy path: 1 KV read/hour, zero writes.
- `GH_INGEST_DISPATCH_TOKEN` set on currena-api (rides the owner's
  token-rotation pass).
- Tests: +9 watchdog branches, +2 cron-routing tests. Suite 1,418
  green; budgets held; typecheck 6/6; lint 0 errors / 15 advisories.

### Deployed

- currena-api **`0eb91818-9a1f-4dd6-ac8f-f250b1004f28`** from `193237e`.
  SITE_MODE=public untouched; currena-markets untouched (`9b5ff7e0`).
- Freshness RESTORED first: a manual `workflow_dispatch` ran the ingest
  immediately (run 35, success) — the public snapshot's generatedAt
  jumped 09:06 → 17:59 and the public projection grew **27 → 28
  readings** (the crypto Fear & Greed card rode in, exactly as the
  2026-10-19b deploy notes predicted). Post-deploy smoke: health 200
  kv ok; insights 200 public; markets 404 hidden_site_mode (by design);
  convert parity 100 USD = 26,790,000 @ 267,900 tgju LIVE.

## [2026-10-19c] — the verdict meter grades in one hue (round 44)

The owner's colour-grading idea, in their words: "when it's stable show
green. when it's yellow the previous grade must be shown with yellow (but
with more tint = eg whiter yellow). when it's orange, the grad turns to
orange, previous ones get orange two like this: [more pale orange]
[pale orange] [orange]. and same for red, with it's critical the all
grades become different tints of red."

### Changed

- `apps/web/src/index.css` (round 44 block) — the round-43 per-segment
  "rainbow" inks are retired. The four-segment verdict meter now grades
  in ONE hue — the CURRENT step's: the highest filled segment wears the
  full step ink; the segments BEFORE it wear progressively whiter tints
  of the same hue via `color-mix(in srgb, <status ink> N%, white)` —
  cautious 55% yellow · stressed 40/70% orange · critical 30/55/78% red.
  Stable stays pure green; unfilled steps stay the border grey.
- `VerdictMeter` + the `QuestionGroup` header meter carry the current
  step to the stylesheet (`data-step`) — every meter on the page grades
  the same way: hero (lg), per-gauge rows (sm), MarketsVerdict, and the
  six per-question header meters. The verdict WORD keeps its own step
  ink (unchanged, round 43).
- Bundle budgets hold: entry 294.78/89.38 vs 296/89.5; Insights lazy
  594.68/142.03 vs 604/142.8 (+0.19 kB raw from the ramp). Tests 453/453
  web (1,407 total), typecheck 6/6, lint 0 errors / 15 advisories.

### Deployed

- currena-api **`e8a47a2d-c593-456a-b4c6-5a9428fd159f`** from `50ba45b`
  (+ the docs wrap-up commit). currena-markets untouched (`9b5ff7e0`).
- Production verified: the deployed CSS asset is byte-identical to the
  local build and carries the full ramp; the live hero meter (Critical,
  step 4) resolves `rgb(244,188,191) → rgb(235,131,137) → rgb(226,79,87)
  → rgb(218,30,40)` (= Carbon Red 60 at the top); per-gauge + per-question
  meters grade identically; the Stable meter stays pure `#24a148`;
  health 200 kv ok; unauthed /api/insights → 200 `public, max-age=60`
  (displayMode public, 27 readings); 375 px scrollWidth === 375; zero
  console/page errors. Evidence:
  `docs/evidence/2026-10-19-round44-meter-grading/`.

## [2026-10-19b] — the Insights page goes PUBLIC (owner decree)

The owner on the private gate: "Why you made the page private? make it
public dude." Going public is the Step 3 spec's own reserved task (§12)
and it is done licence-safely: the public page shows ONLY sources whose
terms allow public display. The private gate's fail-closed design (and
the INSIGHTS_PASSWORD secret) stays intact — flipping SITE_MODE back to
'private' re-arms it instantly.

### Added

- `data/site-mode-overrides.json` — generated, test-pinned hidden set
  (24 indicators + the two EODHD/Yahoo world boards); T-15
  (check-site-mode.mjs) gains a real pass path: public mode passes only
  when the hidden set covers exactly the non-'yes' audit verdicts.
- `projectSnapshotToPublic` — the pure public projection (subset +
  recomputed summaries + the additive `displayMode` schema field),
  written daily by the ingest under `insights:snapshot-public` (+2
  KV writes/day, budget 31 → 33) and bootstrappable from a stored
  snapshot via `pnpm --filter @currena/insights public-projection`.
- Public serve path (SITE_MODE=public, AC-08): mode-aware
  KvInsightsReader (projection keys only — the private document cannot
  leak by construction), 404 `hidden_site_mode` on /markets + /fx and
  on hidden ids' histories (before any KV read), no Yahoo live-prices
  merge, and the web hides the world sections when the snapshot says
  `displayMode:'public'` (no fetch, no cached render).

### Verification

- Tests **1,407** green (+18 public-mode tests), typecheck 6/6, lint 0
  errors / 15 advisories, copy audit clean, budgets held.
- Production: unauthed `/api/insights` → 200 `public, max-age=60`,
  27 public-ok readings, ZERO hidden-id leaks; boards + hidden
  histories → 404 `hidden_site_mode`; the page renders signed-out with
  no gate screen; fa + 375 px clean. Evidence:
  `docs/evidence/2026-10-19-public-insights/`.

## [2026-10-19] — the insights rebuild ships to production (owner-approved)

The AGENT_RUNBOOK execution on `insights-rebuild` (Setup → Phase 7, 14
phase commits — see `docs/insights/FIX_REPORT.md`, `STEP3_REPORT.md`,
`MAINTENANCE.md`, `OWNER_SETUP.md` and `PHASE7_VERIFICATION.md`)
deployed after the owner's explicit approval. The Insights product is
now correct, self-checking (T-01…T-24 + the daily `insights-selfcheck`
Action), **private by default** (every `/api/insights*` route answers
401 with no data until sign-in; `INSIGHTS_PASSWORD` set as a Worker
secret per OWNER_SETUP §1), licence-walked (`LICENCES.md` generated
from the register), and complete for an Australian saver and investor
(Layer 1/2/3, the "Know before you buy US shares" box, the crypto Fear
& Greed context card — corpus 51→52).

### Changed

- Production currena-api → **`b137f3ef`** from `1f70552`; currena-markets
  untouched (`9b5ff7e0`).
- `main` fast-forwarded to the branch (its stray `branches: ain]`
  ci.yml edit is gone — CI triggers on main pushes from here).
- OWNER_SETUP §1 done for the owner: `INSIGHTS_PASSWORD` generated and
  uploaded as a secret (the fail-closed gate is now usable; the value
  lives in the chat handover, never in the repo).

### Verification

- Fresh-clone gates (the sandbox had reset): **1,389 tests green**
  (core 191 · scraper 67 · insights 451 · markets 13 · api 214 · web
  453), typecheck 6/6, lint 0 errors / 15 advisories, copy audit
  clean, T-15 site-mode OK, budgets held (entry 294.79/88.56 vs
  296/89.5; Insights lazy 594.49/141.54 vs 604/142.8).
- Production smoke: unauthed `/api/insights` → 401 `private_page`
  `no-store`; signed 12h HttpOnly cookie → 200 `private, no-store`
  (51 readings, ruleVersion 2); `/admin` 401; convert parity 100 USD →
  26,790,000 IRR @ 267,900 (tgju live).
- Production DOM: the private gate screen → sign-in → full render;
  CSV + XLSX downloaded through the real UI (UTF-8 BOM + audit
  columns / valid OOXML, 10 sheets) with zero errors; fa `dir=rtl`;
  375 px scrollWidth === 375. Evidence:
  `docs/evidence/2026-10-19-insights-deploy/`.

## [2026-10-18b] — the CSV and XLSX exports open correctly in Excel

The owner on the 2026-10-16b full export: "The xlsx and csv outputs are
incomplete and not working. md and txt works." Forensics against real
production data (`/api/insights` + markets + fx, en and fa): the builders
were complete — a strict RFC-4180 parse-back of the CSV returned every
section and all 51 readings, and the XLSX passed `unzip -t`, per-part XML
validation and an openpyxl read-back (10 sheets, 131 rows, real number
cells). The failure was Excel-side rendering of both formats:

### Fixed

- **CSV: the Persian text was mojibake in Excel.** The export was UTF-8
  **without a BOM**, so Excel on a fa-Windows machine decodes it as
  ANSI-1256. Every CSV the app ships now carries the UTF-8 BOM (Excel
  itself, Google Sheets "CSV for Excel" and every reporting tool do the
  same; Sheets/pandas strip it) — the full export AND the three
  long-standing per-table exports (insights / markets / fx).
- **CSV: the flat 26-slot dump read as "incomplete".** One header row
  cannot serve nine different tables: each section only filled some of
  the 26 columns, so Excel showed a sparse matrix with wide gaps. The
  full CSV now mirrors the MD/TXT structure the owner approved — title +
  meta floor, then one **dense block per section** (heading line, the
  section's own header row, its rows), CRLF + trailing CRLF, OWASP guard
  and ASCII numbers unchanged. The flat `Section`-column API is retired
  (shipped 2026-10-16b, replaced before any external consumer).
- **XLSX: the minimal package tripped strict viewers.** openpyxl warned
  *"Workbook contains no default style"* — the same class of gap that
  makes Excel mobile / WPS repair-or-refuse hand-rolled packages. The
  zero-dependency writer now emits the parts real viewers expect:
  `docProps/core.xml` + `docProps/app.xml` (+ content-type overrides +
  root rels), a named **"Normal"** cell style, a per-sheet
  `<dimension ref>` and `<cols>` width 22 (names readable without
  resizing), `xml:space` moved onto `<t>` (Excel's own placement), and a
  plain-decimal guard so `<v>` never carries an exponent form
  (`1.2e-7` → `0.00000012`). Bytes stay deterministic.
- **XLSX (fa): the workbook now opens right-to-left** —
  `buildXlsxBlob(sheets, { rtl })` flips every sheet view for the fa
  export, matching the page. The Receipt export (no opts) is untouched.
- **The download handler no longer swallows failures** — the
  `void import(...).then(...)` chain now has a `.catch` that logs loudly
  instead of a silent nothing-downloaded.

### Verification

Tests 1,331 green (web 443 → 449: BOM + per-section block parse-back +
writer hardening suites); typecheck 6/6; lint 0 errors / 15 advisories;
copy audit clean (zero copy changes); budgets held (entry untouched
294.75/88.52; Insights lazy 603.89/142.61 vs 604/142.8). Browser-verified
on the harness with real production data — in-page module eval: fa CSV
BOM + dense blocks (`gold-usd,قیمت طلا…,4194.6,…`), 10 fa sheets, XLSX
`PK` magic; all four format buttons clicked through the real UI with
zero console/page errors; 375 px scrollWidth === 375. Production
(currena.ir): deployed, smoke green, and the deployed
`full-export-zgApEZWy.js` / `xlsx-writer-DzSEJ58r.js` chunks probed
in-page — docProps, Normal style, dimension, cols, `rightToLeft`, plain
decimals and `xml:space`-on-`<t>` all live. Evidence:
`docs/evidence/2026-10-18-export-fix/`.

## [2026-10-18] — Round 43: the grades wear their colors again

The owner's feedback on the round-42 result: "Revert colors back to the
situation grades." + "Now a considerable white space is created for AUS,
because it has no items to mention, we need to think for that." + "the
place of 'help tool tip' needs better placements" + "the bullet points
aren't at the beginning of the sentence" + "add a container around bullet
points." Full disposition table in
`docs/QA/quirks-2026-10-18-round43.md`; evidence in
`docs/evidence/2026-10-18-round43/`.

### Changed

- **The meters REVERT to the four-step status inks** (round 42's
  neutral-ink decree reversed by the owner): a filled step wears its
  step's own colour again — green / yellow / orange / red, the
  owner-pinned Carbon palette — at EVERY size (hero `lg`, the grouped
  rows' `sm`, MarketsVerdict, QuestionGroup). The words still carry the
  meaning; the meters carry the colour. Unfilled steps stay border grey.
- **The two "?" tips seat at their subjects** (no more lone floats):
  the verdict-rule tip («مبنای تعیین وضعیت هر حوزه») sits in the FIRST
  status group's header, beside the word it explains; the
  how-computed tip («این نتیجه چگونه محاسبه می‌شود؟») rides the verdict
  row itself. `GlossaryTip` gains an optional `panelClassName` so a
  panel hosted in a flex row wraps onto its own full-width line
  (backward-compatible — every other usage unchanged).
- **The alert container becomes clearly visible**: a soft alert-tinted
  bounded box (`ring` 25% / `bg` 5%) — the round-42 container was
  effectively invisible in the light theme.
- **The attention module flows from the top**: the R40 bottom-anchor
  (`mt-auto`) turned Australia's missing bullets into a mid-card hole;
  the spare space now falls to the card's bottom inside edge, where it
  reads as padding. The R30 equal-height stretch stays (no "void under
  Australia" beside the taller card).

### Fixed

- **The alert bullets start at the sentence START in every direction**:
  the old `::marker` rode the inline-block button's LAST-line baseline,
  so on wrapped items the dot landed beside the second line. Each bullet
  now carries an explicit flex marker (one shared `BULLET_DOT` element);
  `items-start` pins it beside the first line — right edge in fa, left
  edge in en.
- **Australia's white space fills with its own data**: a card with no
  section-signal bullets (Australia never grows the alert box — the
  signals are Global-scope) leads with SIX of its own attention tiles
  instead of three, so the space the alert box would have taken holds
  the card's real "items to mention". Cards WITH bullets keep the
  3 + "+n more" economy; the reveal button's count reads
  `tiles.length - shown.length` instead of a hardcoded 3.

### Verification

- No copy changes (zero new/retired strings — copy:audit untouched).
- Gates: tests 1,325 green (core 191 · scraper 67 · insights 403 ·
  markets 13 · api 208 · web 443); typecheck 6/6; lint 0 errors / 15
  accepted advisories (D-24); copy:audit clean; budgets held — Insights
  lazy **603.84/142.59** vs 604/142.8 (the deduped `BULLET_DOT`
  absorbed the round; NO budget bump), entry untouched 294.75/88.53.
- Browser-verified (vite + production data) en/fa × light/dark ×
  375 px/desktop: meters wear the four-step colours, both tips seat and
  expand (tap + keyboard, panels wrap below their rows), the alert box
  is visible in both themes, bullet dots sit at sentence starts, the
  AUS card leads with 6 tiles and no reveal chip, the reveal still
  works on Global (3 → 6), 375 px `scrollWidth === 375`, zero
  console/page errors.
- Deployed currena-api `7b5f7896-3068-4b33-a815-732457cb2f2c` from
  `d643353`; production DOM re-verified (the known one-reload PWA SW
  cycle) — see `docs/DEPLOY.md`.

## [2026-10-17] — Round 42: the hero verdict cards calm down

The owner's feedback on the Insights hero verdict cards (Global /
Australia): "This section has toooooo much color. It's everything and
nothing because being confusing." — with seven specific asks. Full
disposition table in `docs/QA/quirks-2026-10-17-hero-calm.md`; evidence
in `docs/evidence/2026-10-17-hero-calm/`.

### Changed

- **Region mark** (the globe / the Australia map) 48/64 → **24/28** —
  a compact header identifier; the big artwork stays in the dedicated
  sections mid-page.
- **State artwork** (the gauge beside the verdict word) 44/60 →
  **32/40** — proportionate to its word, no longer a shout.
- **The gauges GROUP BY STATUS**: one quiet box per step word
  («پرتنش» / «پایدار» …) with each area and its mini meter inside.
  The flat chip row, the computed reason sentence ("از ۳ حوزه، ۲ حوزه
  یعنی…") and the calm line are retired — they said the same thing
  three times; the grouping IS the sentence and can never contradict
  the gauges because it IS the gauges. `heroReason` stays in config,
  pinned by its tests. Nine reason-line copy keys retired (manifest
  pruned in the same commit).
- **The verdict-rule paragraph** («مبنای تعیین وضعیت هر حوزه: …»)
  hides behind a quiet "?" tip (the shared GlossaryTip pattern —
  tap/keyboard, never hover-only). New key `ui.verdictRuleLabel`.
- **The red notes group into ONE bounded container with bullets**:
  the count line is the header, each raised signal (world stock
  markets, the section indicators, currency patterns) is one disc
  bullet. With nothing to list, the count line rides bare
  (Australia's usual case). Red stays on the alert words only.
- **The how-link** ("این نتیجه چگونه محاسبه می‌شود؟") hides behind the
  same "?" tip: the panel answers in one sentence (`ui.explainerIntro`)
  and keeps **"Read the full explainer"** (new key
  `ui.explainerFullLink`) — which now also SCROLLS to the About
  section (a bare expand below the fold read as a dead click; the
  same roast round 33 answered for the section jump).
- **The meters go low-key**: a filled segment is ONE neutral ink at
  every size — round 36's small-meter decree ("use normal color not
  color coding") extended to the big hero meter. The attention tiles
  lose their pink tint for neutral surfaces. Colour remains only
  where it means something: the verdict word, the alert words inside
  the bounded container, the region's own artwork.
- The multi-ink meter change also applies to the world-markets focal
  verdict box (it shares `.verdict-meter`).

### Verification

- Tests 1,326/1,326 green (no behavioral assertions lost — the
  component had no DOM tests; `heroReason`'s pure-function tests stay
  green), typecheck 6/6, lint 0 errors / 15 accepted advisories,
  copy audit clean (2 new strings triaged `processed`, round-2 ref =
  the QA doc).
- Budgets: the pass **shrank** the Insights chunk — 603.29/142.46 vs
  the 604/142.8 budget (entry untouched 294.75/88.53).
- Browser-verified en/fa × light/dark × 375 px/desktop: groups render
  both statuses, tips expand/collapse (tap + keyboard), bullets
  RTL-align, the markets bullet jumps to the markets section, the
  full-explainer link scrolls + expands About, 375 px `scrollWidth ===
  375`, zero console/page errors.

## [2026-10-16b] — Insights full export: one-file "download all data" (MD/TXT/CSV/XLSX)

The owner's request: a download button that exports every data table the
financial-indicators page displays, in ONE file, in four formats.

### Added

- **"Download data" button** beside Tools in the Insights header (44px
  target, ToolsMenu's disclosure discipline): one click opens the format
  choice, one click downloads. Formats: Markdown (.md), plain text
  (.txt), CSV (.csv), Excel workbook (.xlsx); filename
  `currena-insights-full-<snapshot-date>.<ext>`.
- **Content** (everything the page lists and displays): the hero
  verdicts (the precomputed summary lines), the prices board rows with
  position words and the board's own context lines (gold A$ · BTC
  ratios), the world-markets table (worst-first), the world-currencies
  pairs (group order), the Together connections (card order, with each
  card's relation + right-now leg phrases), the gold/silver signals
  checklists, all 51 indicator readings (the long-standing 12-column
  layout), the upcoming calendar, and this week's state changes — plus
  the meta floor (subtitle, data-as-of, prices-as-of, rule version).
- **Discipline** identical to the existing exports (insights-csv /
  markets-csv / fx-csv): machine-readable VALUES (ASCII digits, period
  decimals, NO grouping — a grouping comma inside a CSV field would
  corrupt the column alignment), localized names/headers, the OWASP
  formula-injection guard on free-text CSV cells, CRLF + trailing CRLF
  for the CSV (RFC 4180); MD/TXT use LF. The XLSX is the in-house
  zero-dependency writer (real number cells), one worksheet per section.
- **Everything lazily loaded**: the builders (full-export 11.18 kB +
  xlsx-writer 5.57 kB) and the format panel (2.75 kB) are separate
  chunks — the Insights chunk grows only by the trigger button, the
  download handler and 14 copy strings × 2 locales (603.71/142.72 vs
  the consciously bumped **604/142.8** — note in the budget script).

### Fixed

- **Popover off-screen bug** (found while verifying the export panel):
  the Tools panel anchored `end-0` slid 75 px off-screen at 375 px EN
  and did the mirrored thing in fa RTL — the anchor side flips with the
  writing direction but the flex-wrap can leave the button at either
  visual edge. Both panels now clamp inside the viewport via a shared
  physical clamp (`lib/clamp-panel.ts`, 8 px margins, X + Y).

### Verification

- 16 new unit tests (web 427 → 443; monorepo 1,310 → 1,326 green);
  typecheck 6/6; lint 0 errors / 15 accepted advisories (D-24);
  copy:audit clean (14 new fa strings triaged in the manifest).
- Browser-verified en/fa × light/dark × 375 px/desktop: all four
  formats download with correct names/MIME/sizes; MD structure, CSV
  columns and XLSX ZIP magic inspected; the panel clamps inside the
  viewport in both directions; zero console errors; no horizontal
  bleed. Evidence: `docs/evidence/2026-10-16-export/`.
- Deploy: currena-api **`30f647f6`** from HEAD `186a070`; production
  XLSX download re-verified on currena.ir (77,366 B, panel clamp OK at
  375 px, zero errors).

## [2026-10-16] — UI/UX quirk pass: touch targets, RTL, signals headings

The owner's polish commission (docs/NEXT_SESSION_PROMPT.md §0) — visual
and interaction quality only; no data, scoring, wording-policy or
behavior changes. Full inventory, verification record and the seven
declined quirks: `docs/QA/quirks-2026-10-16.md`. Evidence:
`docs/evidence/2026-10-16-quirks/`.

### Fixed

- **Header utility icon buttons 40px → 44px** (`HEADER_ICON_BUTTON_CLASS`,
  the install · language · theme · hamburger group) — the WCAG 2.5.8
  touch-target floor; `eb0f3d1`.
- **Footer trust links gain a 32px hit area** (py-2 inline-flex; were a
  bare 16px text line — the smallest targets in the app); `9630c5a`.
- **Converter amount quick-chips 34px → 40px; live-rate copy chip
  32px → 36px; receipt delete button 32px → 36px** — three controls
  under the touch-target floor lifted; `8eb6c94`.
- **Insights fa "prices updated" time drops the seconds** — en/fa time
  precision now matches (shared clock formatter); `5ef803c`.
- **Signals group headings render only when the group has rows** — no
  more empty "Supports"/"Works against" headers; `bb8fb6a`.
- **Converter custom-rate disclosure triangle mirrors in RTL**; `f81eda7`.

### Verification

- Gates at close: tests **1,309 green** (core 191 · scraper 67 ·
  insights 403 · markets 13 · api 208 · web 427), typecheck 6/6, lint
  0 errors / 15 accepted advisories (D-24), copy:audit clean, budgets
  held (entry 294.67/88.53 vs 296/89.5; Insights lazy 599.53/141.53 vs
  600/142 — CSS-only, no bump needed).
- Production DOM (currena.ir, 375 px, post-deploy): all 4 header
  buttons 44×44, footer links 32px, chips 40px, copy chip 36px,
  receipt delete 36px; zero console errors; no horizontal bleed.
- Deploy: currena-api **`9d995f01`** (2026-10-16, ~11:16 UTC) from
  HEAD `8eb6c94`; currena-markets untouched (`9b5ff7e0` still current
  — no markets imports changed).

## [2026-10-15e] — INSIGHTS_FIX_SPEC wrap-up: Part E, published, deployed

The close-out of the 14-October audit's fix project. All 48 spec items
(A-01…A-08, B-01…B-19, C-01…C-07, T-01…T-14) are done and verified —
Part E's item-by-item record lives in `FIX_REPORT.md`, every checkbox in
`INSIGHTS_FIX_SPEC.md` is ticked. This entry pins the publication and
deployment floor the next session starts from.

### Published

- **Ingest**: the daily `insights-ingest` Action (04:20 UTC) now runs
  the full T-01…T-14 validation suite after the fetch and before
  anything is published; today's live run (manual dispatch,
  2026-10-15T01:39Z): 50 sources fetched, none failed, 14/14 tests
  green, 51 readings, ruleVersion 2. Free-tier budget per full
  refresh: **55 KV reads / 31 KV writes / 49 outside requests**.
- **Archive**: `GET /api/insights/archive/2026-10-15` serves the day's
  exact published snapshot (one dated KV key per day, written
  write-only-if-absent).
- **Reference values re-verified post-publish**: Fed 3.75–4.00 decided
  2026-09-16; ECB 2.50 decided 09-10; RBA 4.60 decided 09-29; AU CPI
  4.0 released 09-30; US September CPI released 10-14; peaks gold
  5,586.20 / silver 121.30 / BTC 126,198.07 (daily-high) and Brent
  138.21 (2026-04-07 close); US 10-year at 5.21 reads "highest since
  2007" (episode-aware B-19), 30-year 5.56 "highest since 2004".

### Deployed

- currena-api `cdf4df66` (01:44 UTC, the session's data-bearing
  deploy) superseded by the wrap-up redeploy **`97e8c38a`** (03:05 UTC,
  Workers version #125) from final HEAD `b6a35a7` — every commit after
  the data-bearing deploy is docs/tests-only, so served bytes are
  identical; the redeploy makes the version record unambiguous.
- currena-markets `9b5ff7e0` is UNCHANGED and current: the fix spec
  touched none of its imports (`insights/fx`, `insights/markets`,
  `series` — verified by `git diff fb1fded..HEAD`), and `packages/core`
  grew only optional reader-side fields.
- Post-deploy smoke on currena.ir: health 200; `/api/insights` 51
  readings (fed-expectations +1.04 · us30y 5.56 · philly-fed 37.8 ·
  rba-expectations +0.33); `/api/insights/status` 14/14; the archive
  route 200; markets + fx 200 with the D-12/D-13 cache headers intact;
  convert parity 100 USD → 26,390,000 @ 263,900 (tgju live); `/admin`
  401 (Worker-first gate intact).
- Gates at HEAD: CI green on `b6a35a7`; bundle budgets held (entry
  294.61/88.50 vs 296/89.5; Insights lazy 599.37/141.52 vs the
  2026-10-15d bump 600/142).

## [2026-10-15d] — INSIGHTS_FIX_SPEC: Parts A–D implemented

The 14-October insights audit's fix spec, implemented in full (A:
foundation, B: fixes, C: additions, D: validation). Commits 2dd2eae →
04d36bc. FIX_REPORT.md carries the item-by-item verification record.

### Bundle budget (this entry's own justification)

The Insights lazy chunk grew 582 → 599.37 kB raw / 137 → 141.52 kB gz
(budgets now 600/142): the four Part-C cards (fed-expectations, us30y,
philly-fed, rba-expectations) carry full bilingual copy — 11 fields ×
2 locales. The ENTRY chunk is untouched (294.61/88.50 vs 296/89.5).

### What changed (one line each)

- **A**: indicators.json registry (51 entries, CI-pinned); generated
  needs-attention text (the hand-written `meaning` maps are gone);
  T-01…T-14 validation suite runs before every publish; check-pending
  holds last-good values; daily archive (insights:archive:v1:<date>);
  context notes (off by default); rule version 2 shown on every card;
  /api/insights/status + the About-this-data run status.
- **B**: full-history record peaks with basis (gold 5,586.20 · silver
  121.30 · BTC 126,198.07 — all daily-high, 2026-01-29/2025-10-06;
  Brent 138.21 close 2026-04-07); M2 duplicate detection; the dollar
  speed rule wired to the hero; the relationship cards rewritten as
  explicit rules (windows, pass-through, context legs); release/decided/
  effective dates; quarter labels; UTC timestamps; stale tags; same-date
  gaps; sources on every card; hero counts from the gauge membership
  (37 voters); live-snapshot ratios; points-not-percent on rate charts;
  the real-return-on-savings line; "highest since {year}".
- **C**: the four additions (above) + the ECB decision day on the
  calendar (29 Oct, own timezone; tz now stored on every event).
- **D**: the ingest runs the suite before publishing (a flagged reading
  never reaches the page fresh); fixtures/regression-episodes.json
  (COVID-2020 + inflation-2022, 11 cases, replayed every run and in
  CI); scripts/safety-demo.ts (the operator's broken-input demo);
  KV-read/write/outside-request budget printed every run.

## [2026-10-15c] — D-25/D-26/D-27 decided: all three KEEP (WS-6 fully closed)

The owner's reply arrived in session chat — "do the D25 D26 D27" —
interpreted as adopting each paper's recommendation (option (a) for
all three; no alternative option was named, and the overrule path
stays open: reply to the row in docs/DECISIONS_FOR_ALI.md). Docs-only:
zero code, zero copy, zero behavior change, nothing deployed.

### Decided — the three WS-6 owner papers

- **D-25 (D-08 follow-up — R7's euro-led card): KEEP.** "Mostly a euro
  story" stays rare by basket mathematics (0 of 522 weeks; EUR carries
  57.6% of the D-06 basket) — honest rarity, not a defect.
  `R7_DOLLAR_QUIET` and the basket weights are untouched.
- **D-26 (D-09 follow-up — R5 China link at 15.3% of weeks): KEEP.** A
  touch above the spec's 15% usefulness bar, far under the change
  request's 25% bar, with high catch quality (2018-19, March 2020,
  2022). `R5_USDCNY_M3_WEAK`/`R5_AUDUSD_M3_FALL` are untouched.
- **D-27 (A-11 follow-up — /api/convert's exotic `Number()` forms):
  KEEP.** The finite/positive/≤1e15 gates already reject the dangerous
  forms; the exotic-but-finite forms (`0x10` → 16, `1e3` → 1000,
  ` 42 ` → 42) stay accepted surface, pinned by contract tests.

### Not deployed (docs-only)

Runtime is unchanged: production stays currena-api `155ecb3d` +
currena-markets `9b5ff7e0` (both from `fb1fded`) — a docs-only commit
serves the same bytes. Gates re-run before the commit: 1,255/1,255
tests (core 190 · scraper 67 · insights 356 · markets 13 · api 208 ·
web 421), typecheck 6/6, lint 0 errors / 14 accepted advisories, copy
audit clean, budgets held (entry 294.60/88.50 vs 296/89.5; Insights
lazy 581.45/136.82 vs 582/137).

## [2026-10-15b] — REMAINING_WORK session: reliability minors, test closers, a11y leftovers, the five splits, the advisory worklist

The owner-commissioned follow-up work order (REMAINING_WORK.md at the repo
root, commissioned after the QA long-run). Executed in the recommended
order: WS-1 → WS-2 → WS-3 → WS-4 → WS-5 → WS-6, conventional commits with
CI green between them, both workers deployed + live-verified at the close.

### Fixed — reliability (WS-1, D-19/D-20/D-21)

- **fx fallback validation per-currency (A-5, D-19):** a Yahoo fallback
  answering 5 of 6 required currencies no longer rejects the WHOLE set
  (exactly during a Frankfurter outage, when the fallback is the only
  source) — absent legs hold their stored rows with notes, present legs
  compute; the full-set and empty-set outcomes are pinned unchanged.
- **Subrequest budget 50 → 48 (A-6, D-20):** `putMarketsIfChanged` /
  `putFxIfChanged` take the run's start-of-run `prev` instead of
  re-reading KV — the worst-case provider+KV count now sits 2 under the
  free plan's 50 cap (budget test extended to count KV ops through the
  production store).
- **Serve-time staleness (A-8, D-21):** `/api/insights/markets` + `/fx`
  re-evaluate per-row `stale` at serve time (one daysBetween per row) —
  a multi-day double-cron failure no longer serves frozen `stale:false`
  to machine consumers (CSV exports); fresh snapshots byte-identical,
  ETag identity unchanged (flips land within the ≤5-minute cache
  windows).

### Added — the test closers (WS-2) + characterization suites (WS-4)

- C-6: the markets + fx SPA clients covered at the insights.test.ts bar;
  C-8: the markets cron test READS wrangler.jsonc (config drift now
  fails); C-9 (D-22): jsdom + @testing-library as web devDeps with
  Converter + LiveRates DOM suites.
- WS-4's characterization-first discipline added a 9-test Receipt suite
  (form, live-total LOCAL math, generate guard + happy path, per-item
  currency normalization through the snapshot — the legacy mixed-sum
  bug pinned fixed — and the budget progressbar) and a 6-test Settle
  suite (create-group flow + persistence, detail tablist, add-expense,
  mark-settled balance cancellation). Web tests 352 → 421.

### Fixed — a11y leftovers (WS-3, D-23)

Settle's tabs + BatchConverter's mode toggle are REAL tablists (roving
tabindex, RTL-aware arrow keys via the new shared use-roving-keys hook);
AlertsDialog's radio group gains arrow-key selection; Splitter's ±
steppers carry real verbs (en/fa, needs-review manifest entries);
BatchConverter's share title moved to a copy key; three misleading
constant `aria-expanded={false}` removed; Header/Footer/Converter
quick-tools render REAL `<a href="#/…">` anchors. Declined with reasons
(D-23): the LED table restructure (subgrid CSS architecture), lazy
imgs (no remote below-fold imagery exists), the Insights idle prefetch
(chunk already in the SW precache manifest).

### Changed — de-monolith-ing round 2 (WS-4, behavior-preserving)

- **B-4:** MetaResponse consolidated into packages/core — the api/web
  zod twins deleted, parity tests became single-source tests.
- Five module-tree splits, each characterization-first where coverage
  was thin, one tree per commit: **WorldMarkets** 977 → 262 shell +
  world-markets/ (5); **Receipt** 951 → 560 + receipt/ (5); **Settle**
  947 → 342 + settle/ (8); **fx-presentation** 892 → a 30-line barrel +
  fx-presentation/ (6 — the public surface byte-identical, ten
  importers untouched); **Converter** 849 → 540 + converter/ (7 — the
  shell keeps the conversion state machine; entry chunk 293.60 →
  294.60 raw, inside the 296 budget); **Signals** 813 → 174 +
  signals/ (3). No web/src file exceeds 560 lines anymore.
- One copy-manifest re-point per split that moved a Persian literal
  (the ٪ glyph — the established split-move pattern, text+hash
  unchanged).

### Fixed — the ESLint advisory worklist (WS-5, D-24: 34 → 14)

Every warning the compiler's own prescribed shapes could fix without
behavior churn: the localStorage hydration set-states became lazy
`useState` initializers (Converter recents, Settle groups, History
entries — the Settle `hydrated` guard retired because its crash window
is structurally gone); declaration-order advisories dissolved by pure
reordering; the memo-dependency gaps gained their real inputs
(Together numberLocale, QuestionGroup group, AlertsDialog's extracted
naLabel); BatchConverter's formatters hoisted to pure module functions;
PairsTable's group-header boundaries precomputed. The 14 advisories
that remain are DECLINED, each with a stated reason in D-24 (animation
loops, data-fetch state machines, expand-token responses, the
deliberate onSubmit omission, the ref-in-cleanup, the
compilation-skip) — the rules stay at warn; honesty over lint-perfect.

### Added — owner-decision papers (WS-6, D-25/D-26/D-27 — awaiting Ali)

D-08 follow-up (R7's euro-led card: keep recommended — the 0-in-10y
rarity is basket mathematics); D-09 follow-up (R5 at 15.3% of weeks:
keep recommended); A-11 follow-up (/api/convert's exotic Number() forms:
keep recommended). No behavior change without Ali's go.

### Deployed

Both workers from `fb1fded` (api `155ecb3d` + markets `9b5ff7e0`,
2026-10-14T19:52Z; EODHD secret re-put). Gates: 1,255/1,255 tests,
typecheck 6/6, lint 0 errors/14 advisories, copy audit clean, budgets
held. Live verification: EN+FA, desktop+375px, the money path at live
rates (100 USD → 26,390,000 Toman), all split routes + Insights
sections, zero console errors, D-12/D-13 cache chain + 304 intact.

## [2026-10-15] — Codebase QA session: reliability hardening, contract suites, de-monolith-ing, a11y majors, ESLint

The owner-commissioned autonomous QA session (docs/NEXT_SESSION_PROMPT.md
brief; the full read-only audit with 38 numbered findings lives at
docs/QA/audit-2026-10-14.md). Every critical/major finding is fixed or
documented-with-reason; D-14…D-16 recorded in docs/DECISIONS_FOR_ALI.md.

### Fixed — reliability (the display must ALWAYS degrade honestly)

- **KV-failure honesty (A-1/A-2/A-3, D-15):** `/api/history` answers the
  calm 503 `history_unavailable` (was a raw 500); all four insights serve
  routes guard their KV reads with distinct 503 codes; `/api/status` and
  `/admin` degrade per-row via `Promise.allSettled` (a dead status read no
  longer hides a readable snapshot, and vice versa). The ops console can
  never be the thing that goes down.
- **fx fallback window (A-4, D-14):** the Yahoo fallback asks `range=2y`
  (was `1y`) — the y1 change anchor needs a quote on/before "last date −
  12 months" and a 1-year window has ~zero calendar margin for it, so the
  designed fallback could fail wholesale exactly when Frankfurter was
  down. Spec table updated in place.
- **Cron-kind selection (A-7):** unknown trigger expressions on
  currena-markets log and skip instead of silently running as the retry
  pass.
- **Parser V1 parity (A-9):** `parseFrankfurterTimeseries` drops
  non-positive rates like the fx twin — garbage never rides into
  indicator histories.
- **SPA `fetchMeta` retry (C-2):** a rejected memo no longer pins a dead
  promise for the whole session.
- **rules-of-hooks crash (found by the new ESLint gate):** NextUpStrip
  called `useMemo` after a conditional early return — a latent crash on
  an upcoming→empty transition. Hoisted.

### Added — the contract suites (+113 tests, 1,058 → 1,171)

- `apps/api/src/contract.test.ts` — golden bodies validated against THE
  zod contracts from packages/core for every public route, the exact
  cache-chain matrix (200/304/ETag/`max-age`/`s-maxage` per route per the
  spec rules + D-13), and the /api/convert amount-form pinning.
- `history.test.ts` (the module's first tests), insights reader poison +
  cacheTtl-300/60 contracts, scheduled-wrapper coverage on BOTH workers,
  web `api.test.ts` (the SPA trust boundary), the snapshot-store
  honest-stale/gold-heal/persistence contracts, and the REST-store
  429/10048 retry ladders.

### Changed — de-monolith-ing (behavior-preserving, one module per commit)

- `apps/api/src/index.ts` 850 → 186 lines (routes/, http, security,
  default-service, cron; the insights routes' private errorResponse copy
  deduplicated — audit B-1).
- `packages/insights/src/fx/compute.ts` 984 → a 33-line barrel over
  maths/pairs/weekly/entries/cross-inputs/rules/summary/content.
- web insights `config.ts` 1,507 → `config/` (10 domain modules; the
  99-symbol public surface byte-identical).
- `WorldCurrencies.tsx` 1,291 → 283-line shell + `world-currencies/` (8
  modules). `routes/Insights.tsx` 1,164 → 465-line shell +
  `insights-sections/` (6 modules; **D-16**: the Insights lazy raw budget
  documentedly bumped 580.00 → 582.00 kB for the prop plumbing — gz stays
  inside 137; entry untouched).
- Deliberately left: the i18n copy corpora (single-purpose data files —
  a split would churn ~900 reviewed manifest entries for zero gain) and
  `core/schemas.ts` (the sacred KV-contract file).

### Fixed — accessibility (audit D-1…D-6 + the minor batch)

- A shared `useDialogFocus` hook (the DetailsPanel-proven discipline) now
  gives every dialog focus-in, Tab trap, Escape, opener focus-return and
  scroll-lock: the converter result popup, the receipt modal, the Settle
  modal (whose close button also lost its literal `×` aria-label), and
  the header drawer (which additionally becomes `inert` while closed and
  gains `aria-current`).
- Skip-to-content link on every route (button form — a hash link would
  navigate the hash router away); h1s on the money page (sr-only) and
  LiveRates (promoted board heading); live-region roles, localized LED
  'n/a' labels, `aria-describedby` on the amount field,
  `aria-controls` on the custom-rate disclosure, keyboard-activable
  WorldMarkets rows, `lang` on mixed-direction runs, `<noscript>`, and
  woff2 preloads for the fonts the first viewport actually fetches.

### Changed — hygiene

- **ESLint gate (E-3):** flat config + `pnpm lint` wired into CI after
  typecheck. Zero errors; 34 advisory warnings remain (documented —
  promoting the v6 compiler-grade rules to errors is follow-up work).
- **Dead code (E-1):** knip-verified sweep — 6 deletions, 20 barrel
  trims, 137 exports made module-private across 51 files. Post-sweep
  knip: zero real findings.
- **Dependencies (E-2):** wrangler 4.132 → 4.151; pnpm overrides for
  dompurify / source-map-js / serialize-javascript — `pnpm audit` now
  reports **zero** known vulnerabilities (was 15, all transitive).

### Deployed

- Both workers from `6090842` (CI green): currena-api `93ae180a` +
  currena-markets `d825a8d4` (2026-10-14T14:28Z; pins the version
  marker to the final HEAD). Gates re-verified on a fresh clone first:
  1,171/1,171 tests, typecheck 6/6, lint 0 errors, copy audit clean,
  budgets held (entry 292.77/87.80; Insights lazy 581.44/136.81).
  Post-deploy smoke + browser verification (EN+FA, desktop + 375px,
  zero console errors) recorded in docs/DEPLOY.md. D-14…D-18 logged.

## [2026-10-14] — Freshness: the daily update becomes visible in ~5 minutes

Owner-approved pair of changes (D-12 + D-13) closing the gap between the
23:30/01:30 UTC snapshot runs and what a returning visitor sees. Before:
after a daily fx/markets update, a returning visitor could see yesterday's
currencies for up to **4–5 hours** (browser cache 4 h + edge cache 1 h).
After: **~5 minutes**, end to end.

### Fixed

- **D-12 (zone-side, no code):** the currena.ir zone's legacy *Browser Cache
  TTL* setting was `14400` (4 hours — Cloudflare's old default), silently
  rewriting the origin's `max-age=300` to 14400 on every edge-cache HIT.
  Verified live in a real browser (`cf-cache-status: HIT` served
  `max-age=14400`); fixed via the Cloudflare API to **0 = "Respect Existing
  Headers"**, and verified again — HITs now serve `max-age=300`. Only the
  two edge-cached insights routes were affected; HTML/assets/rates were not.

### Changed

- **D-13 (code + spec):** the `/api/insights/markets` and `/api/insights/fx`
  edge TTL tightened from 1 hour to 5 minutes — `s-maxage` 3600 → 300 on
  both the 200 and 304 responses, and the serve-path KV read `cacheTtl`
  3600 → 300 (`KvMarketsReader`/`KvFxReader`). Specs updated in place
  (world-markets §4 rule 5, world-currencies §5 rule 4) with the change
  note. Read budget: at most one KV read per 5 minutes per active colo per
  route (~288/day/colo) — comfortably inside the free tier, and the account
  is now dedicated to Currena (the owner migrated the other projects off).

## [2026-10-14] — World currencies v1.3: bugs B1–B8, R3 one-month trigger, corrected R7, the plain-language layer

Implements the owner's change request
(`docs/specs/insights-world-currencies-v1.3-change-request.md` — wins over the
v1.2 spec where they disagree). Full requirement → code → test map in
`docs/specs/traceability.md`; every agent decision in `docs/DECISIONS_FOR_ALI.md`
(D-07…D-11); 14 QA'd screenshots in `docs/screenshots/`.

### Fixed (change request §2 — the eight bugs from Ali's review)

- **B1** R7 said the dollar "barely moved" at +3.2% — R7 now works in dollar
  strength (§3.3): dollar-led / euro-led / no card, never a guess.
- **B2** the context card counted as an active pattern and led the headline —
  only counted Active/Watching rules lead; R7 never does.
- **B3** dots and "Held in" lines on rules without a pattern check (R4, R7) —
  gated by `fxRuleHasPatternCheck`.
- **B4** raw codes (EURUSD, DOLLAR, …) on screen — plain names everywhere,
  both locales, chart labels included.
- **B5** warning lines on the context card — removed; other cards state the
  alarm level in words ("The alarm sounds if…").
- **B6** the closest-to-alarm pattern repeated in the quiet list — excluded.
- **B7** the fixed dollar meaning line — follows the direction now
  (stronger / weaker / steady, CR §4.9).
- **B8** "calm" during the dollar's biggest one-month move — fixed by the new
  R3 trigger + the big-mover headline.

### Changed

- **R3 fast-move trigger (§3.1):** Warning at dollar M1 ≥ +3.0 or M3 ≥ +4.0
  (supportive mirror); the sentence names the leg that fired; distance to
  warning uses the nearer leg. Evidence replay (522 weeks): warning 14.2% of
  weeks, M1 leg alone 10.7% — under the 25% change bar, thresholds kept (D-07).
- **Corrected R7 (§3.3):** card only when EUR/USD moved ≥2.5% in a month;
  dollar-led when the dollar measure agrees and \|d\| ≥ 1.5; euro-led when
  \|d\| < 1.0; otherwise no card. Honest finding for the owner (D-08):
  euro-led fired 0 times in 10 years — the euro carries 57.6% of the Currena
  basket, so a big euro month nearly always drags the measure past the
  dollar-led line. Not broken, mathematically rare; any change needs Ali.
- **Calm-with-a-big-mover headline (§3.2):** "No warning pattern is active,
  but the US dollar is up {x}% this month."
- **Bundle budget:** Insights lazy chunk 545/128.5 → 580/137 kB (543.31/127.75
  → 579.62/136.48) — the v1.3 plain-language layer + ~150 copy strings × 2
  locales, all wording verbatim from the change request. The entry chunk
  (the converter money page) stays untouched at 290.36/87.08 vs 296/89.5.

### Added

- **The plain-language layer (§4):** "In plain words" block (S1 dollar ·
  S2 biggest movers · S3 Australian dollar · S4 mood), S5 money line in every
  pair panel; four-answer pattern cards (headline verdict, "What would change
  this", "In everyday terms"); the quiet-area rework ("Nearest to sounding the
  alarm", "{n} more quiet patterns"); the "How to read this section" drawer
  (5 items); 10 glossary tooltips; plain chart captions; the direction-aware
  "US dollar strength" row; stored `plain` fields (128 bytes — CR §6's < 1 KB).
- **`docs/specs/traceability.md`** — every requirement of both documents
  mapped to its implementation and its proof.
- **14 screenshots** in `docs/screenshots/` (en/fa × desktop/phone × all
  states), visually QA'd.

### Tests

- 1,058/1,058 workspace-wide (core 183 · scraper 67 · insights 339 · markets
  7 · api 136 · web 326), including the 31 new `fx-v13.test.ts` cases for the
  acceptance matrix T1–T11 + S5; typecheck 6/6; `pnpm copy:audit` clean.

### Repo tidy-up

Root now holds only README/CHANGELOG/AGENTS: the v1.3 change request moved to
`docs/specs/`, six superseded spec drafts/fix lists to `docs/specs/archive/`
(indexed), 16 Persian-copy working documents to
`docs/localization/persian-site-copy/`.

## [2026-10-13g] — Round-2 wrap-up: calendar titles live in the snapshot, final QA re-run

Closes out the 2026-10-13f wave. No code changed; this records the
operational finish line and the re-verified quality gates.

- **Calendar titles landed in the KV snapshot.** The 14 revised `titleFa`
  values (RBA «تصمیم بانک مرکزی استرالیا دربارهٔ نرخ رسمی بهره», Fed, ABS
  jobs/CPI, US CPI/jobs) are baked into the snapshot by the ingest. The
  2026-10-13T23:07 UTC dispatch confirmed every fetch/scoring step green —
  only the final KV write was refused by the account-wide free-tier daily
  cap (HTTP 429, code 10048). The first post-quota-reset ingest (run
  38487665811, dispatched 2026-10-14T00:00:48Z) succeeded and stored the
  snapshot (generatedAt 2026-10-14T00:01:14Z): all 22 calendar events now
  serve the revised titles live (verified in-browser; the scheduled 04:20
  UTC run is the standing backstop).
- **Final QA re-run on 996f496** (identical code to the deployed 841c783):
  typecheck 6/6 packages, 1,020/1,020 tests (core 183 · scraper 67 ·
  insights 334 · markets 7 · api 136 · web 293), `pnpm copy:audit` clean,
  CI green.
- **Redeployed the SPA/API worker** so the live deployment matches HEAD.

## [2026-10-13f] — Persian copy round 2 applied + permanent localization audit system

The owner returned all seven polished round-2 reference parts
(`persian_site_copy_round2_part1..7_*_polished-translated.md` — 1,522 entries,
every remaining fa string after round 1). The approved wording is applied
across the whole Persian surface, and the repo now carries a permanent audit
system so review status is never lost again.

### Applied (values only — keys, tokens, EN dictionary, logic untouched)

- **Insights dictionary** (`insights-copy-fa.ts`): 886 strings replaced
  (dashboard UI, markets/fx sections, money/signals/together panels, the
  47 indicator cards, the meaning one-liners behind `as Partial` casts).
- **App dictionary** (`fa.ts`): 225 strings replaced (converter core, tools,
  navigation, errors, accessibility labels); `currencies.irrLabel` is now
  «تومان (IRR)».
- **Calendar** (`data/insights-calendar.json`): all 14 remaining `titleFa`
  titles (RBA decisions now «تصمیم بانک مرکزی استرالیا دربارهٔ نرخ رسمی بهره»).
- **Inline strings** (ICS calendar name, header language chip/menu) and the
  four `format.ts` time-ago mirrors were reviewed and confirmed unchanged.
- No em dashes introduced; every `{placeholder}` preserved (verified
  programmatically); 7 test pins updated to the new approved wording;
  full suite green (1,020 tests).

### The audit system (docs/localization/)

- `persian-copy-manifest.json` — 1,842 entries: every user-facing fa string
  (1,802 dictionary keys, 22 calendar titles, 18 hardcoded literals) with its
  final text, a conservative sha256 fingerprint (NFC only), source location,
  round and reference. Statuses: processed / unreviewed / needs-review.
- `scripts/audit-persian-copy.mjs` (`pnpm copy:audit`) — AST-based checker:
  new dictionary keys, new hardcoded Persian literals (comments/tests never
  scanned), changed reviewed text, removed entries, en↔fa key parity, and
  time-ago mirror sync. Wired into CI as a gate next to the bundle budget.
- `scripts/update-persian-copy-manifest.mjs` (`pnpm copy:audit:update`) —
  records review decisions (snapshots current text; `processed` requires
  round+reference).
- `persian-copy-workflow.md` — the six-step workflow for future copy changes.
- `persian-terminology.md` — the approved financial glossary with fixed
  status/level vocabulary and context-sensitive pairs that must not unify.

### Budget

- Insights lazy chunk 501.96/122.69 → 543.31/127.75 kB (budget 505/123.5 →
  545/128.5): 1,087 insights strings replaced with the approved natural
  Persian — localized strings only, zero logic; entry chunk untouched.

## [2026-10-13e] — Revised Persian website copy applied (persian_site_copy_edited.md)

The owner uploaded `persian_site_copy_edited.md` (an editorially revised
Persian snapshot of the Insights page) as the authoritative reference. Its
revised wording is now applied to the live Persian dictionary
(`apps/web/src/i18n/insights-copy-fa.ts`), the shared Farsi terminology is
standardized wherever the same financial concepts appear, and the calendar's
Persian event titles follow the same wording. Values only — keys, tokens
(`{date}`, `{n}`, `{count}`, `{bandPos}`, …), the English dictionary and the
localization architecture are untouched, and no em dash was introduced.

### Changed (fa dictionary)

- **Hero/header**: subtitle, data-as-of line + snapshot tooltip, the
  prices-updated line, inAlert count sentence, the full verdict-rule
  methodology paragraph, hero-reason templates (now "از {n} حوزه، {k} حوزه
  یعنی «{names}» در وضعیت {word} قرار دارد" + "سایر حوزه‌ها …"), calm-list
  label, the biggest-move title/reason, the what-changed kicker, coming-up
  title, and the price-board intro.
- **Position vocabulary**: position10y → «جایگاه در بازه ده‌ساله»; the
  position words → «در سطح بالا / در محدوده معمول / در سطح پایین»; the
  price-tile status word → «بالا»; range-end labels → «کمترین/بیشترین مقدار
  در ۱۰ سال»; rangePast* window labels shortened («در سه‌ماهه», «در یک سال»,
  «در پنج سال») and the range chips «یک سال / پنج سال».
- **Indicator renames** (the reference's plain-language set): real yields and
  bond yields as «بازده واقعی اوراق قرضه ۱۰ساله آمریکا» / «بازده اوراق قرضه
  ۱۰ساله دولت آمریکا» / «… استرالیا», the yield curve as «فاصله بازده اوراق
  قرضه ۱۰ساله و ۲ساله دولت آمریکا», CPI-style cards as «تغییر قیمت‌ها در
  … نسبت به سال قبل», «شاخص ترس بازار», «شاخص دلار آمریکا در برابر شش ارز
  بزرگ», «دلار آمریکا/استرالیا در برابر ین ژاپن», «حجم پول در اقتصاد
  آمریکا», «نرخ بیکاری آمریکا», «سهم افراد بیکار در استرالیا», «رشد
  اجاره‌بها نسبت به سال قبل», «قیمت صادرات استرالیا در مقایسه با واردات»,
  «نرخ بهره وام مسکن پرداختی خانوارها», «نرخ سود سپرده‌های مدت‌دار جدید»,
  «قیمت طلا/نقره، هر اونس», «قیمت نفت برنت», «یورو در برابر دلار آمریکا».
- **Meaning one-liners** for every warning tile/card in the reference, now
  two-sentence plain paragraphs (real yields, US 10Y, brent, au-10y, home
  loan, wage growth, US CPI, trimmed mean, unemployment, au-cpi) plus the
  state lines the reference showed (highRising for real-yield/us10y/au-10y,
  jumping for brent, highEasing for gold/silver/breakeven, typical for
  yield-curve/stress/nfci/vix/dollar-basket/audusd/terms-of-trade, low for
  rent) and the definitional one-liners (au-trimmed-mean, au-cpi, au-home-
  loan, china-pmi, btc-usd).
- **Groups + gauge answers**: all nine group questions and answers rewritten
  («آیا هزینه وام‌گیری بیشتر می‌شود؟», «آیا بازارها نگران‌اند؟», «وضعیت
  تجارت و دلار استرالیا چگونه است؟», …); groupShort «هزینه وام‌گیری», «رشد
  اقتصادی».
- **Prices board**: gold-A$ line, below-peak wording («پایین‌تر از سقف ده‌ساله
  خود»), the bitcoin ratio sentence («با قیمت فعلی، یک بیت‌کوین معادل …»),
  price captions («داده‌ها تا تاریخ …»), companion notes for US CPI (energy
  gap) and au-10y (for comparison).
- **World markets**: subtitle, as-of caption («تاریخ داده‌ها: …»), the
  in-correction count, tile tags («پایین‌تر از سقف یک‌ساله», «در سقف
  یک‌ساله»), the local-currency note, takeaway/hero-alert templates, the
  measure label «بازارهای سهام: چند بازار با فاصله از سقف یک‌ساله».
- **World currencies**: subtitle with «؟», as-of caption, warning-line and
  distance-bar formats («{pair}: {value}؛ آستانه هشدار: {threshold}»), the
  dots/reliability lines, level-3 toggle («چرا این الگو کار می‌کند و اعداد
  چه می‌گویند؟»), closest-to-warning label, quiet-patterns line, the
  dollar-row title («دلار در برابر ارزهای جهان») + its "you" line, r6's
  name («نگرانی درباره اروپا»), the r7 euro-led see/means pair, the opposite
  chart caption, the ECB-rates footer line, and fx units («به‌صورت شاخص»,
  «به‌صورت نسبت»).
- **Money panel**: section title/subtitle, the direction words («احتمال
  افزایش هزینه‌ها» / «احتمال دریافت سود بیشتر»), the savings + shop row
  names, and all four attention sentences.
- **Signals**: title with «؟», subtitle, merged title («شرایط مؤثر بر طلا و
  نقره»), the lean wording + metal-lean template, verdict title («شرایط
  فعلی») and the down verdict sentence, the against wording («در تضاد با
  الگوی معمول»), the gold-high-yields warning, all six condition names/how
  lines, silver-only heading («فقط برای نقره»), the footing block
  («سطح قیمت» + «جایگاه قیمت در بازه ده‌ساله: {band}») and the 30-day
  speed label («تغییر ۳۰روزه»).
- **Together**: section title («ارتباط میان شاخص‌ها») + subtitle + evidence
  note, the right-now active line, the per-leg move verbs («افزایش می‌یابد» /
  «کاهش می‌یابد»), and the three revised connections (names, leg labels,
  relations).
- **About the data**: credits line, sources body, FRED local note, the
  RBA/ABS/ECB/basket/EODHD attribution lines, schedule + rules + disclaimer
  rewrites, the FRED notice heading, and the backtest line.
- **Shared terminology sweep** (same concepts, consistent wording):
  borrowing costs «هزینه وام‌گیری» through the us10y state lines/forYou and
  the au-us-10y-gap name, real-yield lines and one-liner «بازده واقعی»,
  au-10y's highEasing/low «بازده اوراق قرضه ۱۰ساله استرالیا», M2 «حجم پول»
  (name, one-liner, meaning), and the yield-curve one-liner «فاصله بازده».

### Changed (data)

- `data/insights-calendar.json`: all abs-jobs Persian titles now read
  «گزارش وضعیت بازار کار استرالیا: …» and all Fed titles «تصمیم فدرال رزرو
  آمریکا درباره نرخ بهره» (the reference's event-strip wording).

### Tests / budgets

- `markets-verdict.test.ts`: the attributionEodhd pin follows the revised
  line; `insights.test.ts`: the Arabic-keyboard normalization test now rides
  the revised au-unemployment name («بيكار» → «سهم افراد بیکار در استرالیا»).
- Insights chunk 493.99 → 501.96 kB raw / 120.95 → 122.69 kB gzip; budget
  bumped to 505/123.5 with this note. All localized strings, no logic; the
  entry chunk untouched. `pnpm -r typecheck` clean, 1,020/1,020 tests pass,
  `pnpm build` clean.


## [2026-10-13d] — Sources off the cards (attribution lives in the footer and the Sources section only)

Owner request 2026-10-13: the price tiles and indicator cards must NOT carry
source labels ("· Yahoo Finance: COMEX gold futures (GC=F)", "· FRED", …).
Every source is named and linked in exactly two places now: the details panel
footer (full sourceName with series ids, linked) and the About this data →
Sources section at the foot of the page.

### Changed

- **PricesBoard**: the tile's caption row drops the "· {source}" bdi; it keeps
  the as-of date and the stale chip. The comment trail (Step-1 A9) now points
  to the details panel for the contract attribution (BZ=F futures vs the EIA
  spot base).
- **AlertCard**: the bottom caption row drops the "· publisher" segment; the
  data date, released-on date and stale tag stay.
- **config.ts**: the `friendlySource` publisher-trimmer (R30) died with the
  card labels — removed with its comment block replaced by the new rule
  (sources live in the details panel footer + About/sources, never on faces).
- **Copy (en/fa)**: `aboutSourcesBody` no longer claims "Each card names and
  links its own source" — it now says each source is named and linked in the
  details panel and in the Sources section, never on the cards. The unused
  `sourceLabel` key was removed from both dictionaries (fa is typed against
  en, so the removal is structurally guaranteed to stay in sync).
- **Card-face copy de-sourced (en/fa)**: the oneLiner lines that render on
  card faces via the consequence fallback dropped their data-provider
  mentions, moving them into `whatItIs` (details panel) where they belong:
  btc-usd ("an hourly quote from Yahoo Finance's spot index on a daily
  gold-api.com backbone" now lives in whatItIs; the oneLiner is simply "The
  world price of one bitcoin, in US dollars."), au-petrol-yoy ("as the ABS
  measures it" dropped) and au-wage-growth ("by the ABS wage price index" →
  "by the wage price index"). Subject naming stays on faces by design: "the
  RBA's 2–3% band", "The St. Louis Fed's single gauge", "the ECB's deposit
  facility rate" name WHAT is measured, not who supplied the data.
- **packages/insights definitions.ts**: comment-only touch (the A9 note now
  says the details panel, not the tile, carries the attribution).

### Untouched on purpose

- The details panel footer (the linked source + as-of date) — it IS a footer.
- The About this data → Sources section and the always-visible credits line.
- The calendar badges (RBA / CPI / JOBS / FED): they name the EVENT, not a
  data source. The converter app's SourceBadge (TGJU/Frankfurter) is a
  different feature and was not part of the request.
- CSV exports still carry per-row source names (a data export, not a card).
- Data layer: `sourceName`/`sourceUrl` still flow through the API and the
  Step-1 G3 attribution rules; only the card-face renders changed.

Checks: `pnpm typecheck` clean, `pnpm test` 1,020/1,020 (core 183, scraper
67, insights 334, markets 7, api 136, web 293), `pnpm build` clean,
`check-bundle-budget` held (Insights chunk 493.65 kB / 120.80 gz — smaller
without the trimmer).

## [2026-10-13c] — The bilingual content audit (Persian + English editorial pass)

Owner request 2026-10-13: a comprehensive audit and rewrite of ALL Persian
and English user-facing text, edited as a bilingual financial desk would:
natural, idiomatic, accurate, plain enough for non-economists, no em dashes,
no literal translation artifacts. Scope: the full Insights corpus
(insights-copy-en/fa: 41 indicators × 6 fields, consequence lines, meaning
lines, markets + fx sections, together/signals/money), the main dictionary
(en.ts/fa.ts: converter, alerts, boards, receipt, splitter, settle, batch,
about, errors), and the PWA manifest name. Code, keys, interpolation tokens,
units logic and all tests' semantic guarantees are untouched; every pinned
string stayed pinned (fx headlines, attribution lines, leg phrases, band
labels).

### Persian (the bulk of the work: ~440 strings rewritten)

- **Broken grammar repaired**: «فشار دلاریِ همیشگی پیداست نیست» → «دیده
  نمی‌شود»; «پس یک ماجرای جهانی است» → «پس ماجرایی جهانی است»;
  «فرانسه دومین اقتصاد بزرگ منطقهٔ یوروست» → «یورو است»;
  «رکورد دلاری، رکوردِ قدرت خرچ نیست» → «خرج» (typo); «دلار آمریکای
  قوی» → «دلار قوی آمریکا»; «میانگین است: پنهان می‌کند بدهی...» →
  «و پنهان می‌کند که...».
- **Calques replaced with natural Persian**: چرخ‌فلک (Ferris wheel!) →
  الاکلنگ for the see-saw; لوله‌کشی بازار (market plumbing) → سازوکار
  بازار; قرائت‌های نوجوانی/دههٔ بیستی (VIX "teens/20s") → ارقام نوجوان
  (زیر ۲۰) / حدود ۲۰ تا ۳۰; سوپر (superannuation) → صندوق بازنشستگی;
  قبض بهره (interest bill) → هزینهٔ بهره; لکه‌های ۲۰۱۷ (pockets) →
  افت‌های موضعی; ترس از رشد (growth-scare) → نگرانی از رشد; کاشی →
  کارت (view-switch aria); جفت کارری → جفت کری ترید (media usage);
  «هدف نرخ اسکناس» (wrong term for the RBA cash rate) → «هدف نرخ
  بین‌بانکی شبانه»; هم‌زادیِ پس‌اندازی → قرینِ پس‌اندازی; آینه‌عقب →
  reworded; فشارسنج زیرِ نظر بازارها → بارومتر ریسک.
- **Terminology unified across the corpus**: headline inflation → تورم کلی
  (was تورم سرنویس); percentage points → واحد درصد (was نقطه; test
  updated to the new term); safe haven → پناهگاه امن (was ارز امن in two
  places); tight/tightening policy → سخت‌گیرانه (was سفت, in six lines);
  loose → آسان (was شل); Works against → در تضاد است everywhere (verdict
  words now match the Round-32 owner decision); Mixed → مختلط (was the
  odd آمیخته); Unusual → غیرعادی (fx chip was غیرمعمول); demand deposits
  → حساب‌های دیداری (was the ambiguous حساب جاری); preferred measure →
  ترجیحی (was محبوب); gold "Used Gold" → طلای کارکرده (the Tehran market
  term; also نیم‌سکه/ربع‌سکه half-spaces).
- **Half-spaces, ezafe and punctuation**: به‌روزرسانی لحظه‌ای (was به
  روزرسانی لحظه ای), ساخته‌شده, تولیدشده, جست‌وجوی, دادهٔ قدیمی,
  هزینه‌های روزانهٔ خود, عادی‌سازی of the "jumping" lines (پیش از
  برداشتِ روند کمی صبر کنید), and the double-colon footnotes (gold
  boards) restructured in both locales.
- **Semantic fixes**: fed-target whatItIs said «نقطهٔ میانی بازهٔ هدف»
  while the card (per the Step-1 audit) shows the FULL RANGE — now
  «بازهٔ هدف»; au-home-loan "outstanding" → وام‌های جاری (was باز, which
  reads as "variable"); savings "overseas money can stretch further" was
  mistranslated as «دوام بیاورد» — now «خرج بردارد»; fa aboutRulesBody
  carried an extra backtest sentence the EN lacks — dropped for parity.
- **Em dashes**: all 30 user-facing — removed (parentheses, semicolons or
  colons as fits each sentence); code comments untouched.

### English (~80 strings)

- All user-facing em dashes removed (Sahm rule cluster, dataForStale,
  collapsedStale ×2, hero alert lines, scoredFact/contextOnlyFact, the
  CAC/Dow entries, goldHighYieldsWarning, attribution body, backtest note).
- Plain-language fixes: "the 20s" → "those in the twenties" (VIX);
  "dollar wallets" → "anyone holding dollars"; "approximates the bowser" →
  "only approximates the pump" (bowser is Australian-only); "hang tight" →
  "give it a moment"; "ONE count rule" → "a single count rule";
  "Aussie dollar" → "Australian dollar" (register consistency);
  "sat at historic highs through 2023–26" → "have sat at historic highs
  since 2023"; the muddled au-10y "the decade before sat far lower after
  2020's emergency setting" untangled.
- Main dictionary: error-text punctuation, the honest alerts note expanded,
  no-internet copy gets its article, the About intro de-jargoned, the batch
  subtitle hyphen, gold-board footnotes' double colon.

### Housekeeping

- PWA manifest name: "Currena — Currency Converter" → "Currena | Currency
  Converter" (matches the document title; em-dash rule).
- Price-tile attribution (the data layer): the four live-quote source names
  "Yahoo Finance — …" → "Yahoo Finance: …" (brent/gold/silver/bitcoin);
  the stored snapshot picks the new names on the next hourly refresh.
- Bundle budget: Insights lazy chunk 493/121.5 → **495/121.5 kB** (raw
  +2.18 kB from longer-but-natural Persian; gzip actually fell to 120.95).
  The entry chunk is untouched (290.36/87.08).
- One test expectation updated with the terminology change
  (formatChange fa points unit: نقطه → واحد درصد). All 293 web + 136 api
  + 334 insights tests pass; typecheck clean.

## [2026-10-13b] — Always-live serving + path-URL routing (the /insights#/ fix)

Owner report 2026-10-13: "I didn't see those [Step-2] fixes — and why does
`https://currena.ir/insights#/` happen? The server seems to show a cached,
stale page to outside visitors (firecrawl mirrors are pre-fix). Currena must
ALWAYS show the live version; only show cached when there is no internet."

Diagnosis first (the deployed state was audited BEFORE any change): GitHub
main was current (31b3d3d), currena-api was the Step-2 deployment
(cebc12de), and the live edge was serving the Step-2 chunks (Insights
491.81 kB with sahm/vix/deposit/unemployment inside) — nothing was actually
un-deployed. Two CLIENT-side defects made it LOOK stale:

1. **Path URLs booted the wrong page.** Visiting `https://currena.ir/insights`
   (typed, shared, crawled — no `#`) hit the SPA-fallback, and the boot's
   belt-and-braces `navigate('/')` APPENDED a stray `#/` — URL
   `/insights#/`, content: the converter. Every crawler that renders the
   path URL (firecrawl web-to-md) extracted the CONVERTER, which reads as
   "a cached pre-fix mirror".
2. **Service-worker navigations were precache-first.** workbox's
   `navigateFallback: 'index.html'` answered every navigation from the SW's
   precached copy, so a visitor (or installed PWA) kept seeing the PREVIOUS
   deploy until their SW rotated — the stale-page trap this project already
   lived through in its prompt-mode variant on 2026-09-19.

### Fixes

- **Path visits adopt their route** (`apps/web/src/router.ts` +
  `App.tsx`): `/insights` is rewritten IN PLACE to `/#/insights`
  (`history.replaceState` — no reload, no history entry, no stray `#/`) and
  renders the Insights page; `/insights?card=us10y` share links and
  `/?from=EUR&to=IRR&amount=500` converter deep links work from the address
  bar for the first time; trailing slashes tolerated; unknown paths land on
  the converter as before. Pure core (`canonicalHashFor`) unit-tested —
  router tests 7→12.
- **Navigations are network-first** (`apps/web/vite.config.ts`): the
  navigateFallback is GONE (the explicit `navigateFallback: undefined` is
  load-bearing — vite-plugin-pwa defaults it back to `'index.html'` and
  workbox registers its precache-first NavigationRoute BEFORE runtime
  routes); a `NetworkFirst` runtime route (`currena-documents`, 5 s
  network timeout) now answers every same-origin navigation — the network
  is always asked first and the cache answers ONLY when offline, exactly
  the owner's rule. /api, /internal and /admin never reach it. Hashed
  assets stay precache-first (immutable per deploy — a new build changes
  every hash, so the precache can never serve an asset the live HTML
  doesn't reference).
- **`_headers` for the assets platform** (`apps/web/public/_headers`):
  `/assets/*` are `max-age=31536000, immutable` (content-hashed — always
  correct, one revalidation round trip cheaper); `index.html` and `sw.js`
  revalidate on every request.

Gates: typecheck 6/6, tests 1020/1020 (web 288→293), bundle budgets held
(entry 290.36/87.08, Insights 491.82/120.65).

## [2026-10-13] — Insights Step-2 add list (the missing indicators)

The owner's three-step plan continues: **Step 2 — add the few missing
indicators that matter to a regular Australian saver-investor**, per the
uploaded `currena-insights-step2-add-list (1).md`. Every new card follows the
file's §A card spec (source + data date + stale tag + condition wording +
stored history); nothing from the §F "do not add" list is built. Phase-1 audit
first: every Step-1 fix re-verified live (nothing left behind — see
docs/evidence/step1-audit/ and the worklog).

### B. The seven required additions

- **RBA cash rate card finished (§B1).** The card moved into
  `au-households` NEXT TO the home-loan card (both render from the same
  snapshot), states the LAST CHANGE as its exact step (the new engine
  `lastChange` field: date + size, e.g. "+0.25 pts on 29 Sep 2026" — not a
  30-day window that loses a six-week-old decision) and the NEXT RBA
  decision date from the calendar ("Next RBA decision: Nov 3, 2026").
  Context-only, as the file specifies.
- **Australian 10-year government bond yield (§B2).** RBA statistical
  table F2, series FCMYGBAG10D (venue-verified: published 09-Oct-2026,
  daily; the same series the au-us-10y-gap card already subtracts). Scored
  on its 10-year position; the US 10-year yield rides INSIDE the card as a
  comparison companion ("shown for comparison") via the new COMPANIONS map.
- **US unemployment (§B3).** FRED UNRATE (live-verified: Sep 2026 = 4.2).
  Scored on its own 10-year level — the "rising fast" signal belongs to
  the Sahm card beside it, so the pair never duplicates.
- **Recession alarm — the Sahm rule (§B4).** FRED SAHMREALTIME
  (live-verified: Sep 2026 = 0.00). Threshold above 0.50, the standard
  signal, with the rule explained in one plain line on the card.
- **Market fear gauge — VIX (§B5).** FRED VIXCLS (live-verified: Oct 9 =
  14.84; Cboe data redistributed through FRED, © Cboe noted on the card +
  About + the commercial-licence review list). Scored on its 10-year
  position; the card ALWAYS shows the value + its 10-year position, and
  the details panel states that the calm/nervous word thresholds arrive
  with the Step-3 verdict rules (computed from the stored history).
- **Iron ore — context only (§B6).** The World Bank Pink Sheet stays the
  source (FRED's PIORECRUSDM mirror of the same series LAGS ~2 months —
  verified: WB carries Sep 2026 = 97.7 while FRED ends Jul 2026; the card
  names the WB source). The rule flipped from percentile to info: iron ore
  never votes, removing it from the au-trade-currency gauge; the
  iron-terms-aud relationship card reads the same reading (always has).
- **"Savings and interest" finished with a real deposit rate (§B7).** RBA
  F4.1 "Paid Deposit Rates", series PDRNTH — the weighted-average rate
  banks actually pay on NEW household term deposits (venue-verified:
  August 2026 = 4.8% per annum, table published 08-Oct-2026; the old F5
  layout no longer exists). The savings money-row now leads with THIS
  number + its data month + the piggy-bank artwork, the cash rate stays
  as context, and the row's state/votes read from the same readings.

### A. The card spec, applied to every new card

- Source name + series ID + link (details panel); how often the source
  updates; how old data may get before the "stale" tag (the details
  panel's new facts block: "Updates monthly · shows 'Stale' after 70 days
  · Fetched … · Scored/Context only"); units in percentage points for
  rates; data-for + released + fetched dates; condition wording only.
- **History storage raised to the spec's minimum**: the per-indicator
  history cap moved from 520 (weekly-ish stride) to 2,700 points — a
  10-year DAILY series now stores its full daily window (VIXCLS, DGS10,
  F2, F1…), monthly series keep their full 10 years, and the au-deposit
  series keeps its whole 2019–extent (the table's full history). Step 3's
  verdict rules compute from exactly these stores.
- KV write budget: ~5 new history keys/day on top of the ~750-write
  headroom at the 04:20 UTC ingest slot — no scheduling change needed.
- The FRED release-dates API needs an API key the project does not hold
  (noted for §D): US calendar dates are hand-maintained in the data file
  after verification.

### D. Calendar — the six events that move Australian money

- Two new event kinds join RBA/ABS-CPI/Fed/US-CPI: **abs-jobs** (ABS
  Labour Force: Oct 15, Nov 19, Dec 17 2026 — verified from abs.gov.au)
  and **us-jobs** (US Employment Situation: Nov 6, Dec 4 2026 — verified
  via the Forex Factory aggregated calendar after bls.gov and archive.org
  proved unreachable; the Oct 14 US CPI date cross-checks with the same
  source and the owner's own audit file). US CPI extended (Nov 10, Dec
  10). Release-schedule entries added so us-unemployment/sahm-rule/
  au-deposit-rate/au-unemployment cards state their release dates.
- All events stay plain dates + their own timezone (the Step-1 rule).

### E/F. Placement + scope

- au-10y joins au-inflation-rates; rba-cash-rate + au-deposit-rate join
  au-households around the home-loan card; us-unemployment + sahm-rule
  join growth-health; vix joins market-stress; iron ore stays in
  au-trade-currency as context. The hero counts follow automatically from
  the SAME E1 verdict rule (no new mapping). Voters: 32 (19 global +
  13 AU). Nothing from the "do not add" list was built; the two §C
  optional items (AIP petrol, AUD/CNY) were NOT approved and were not
  built.

### Tests + gates

- 1,015 tests green (core 183 · scraper 67 · insights 334 · markets 7 ·
  api 136 · web 288), typecheck 6/6 clean, bundle budgets held (Insights
  chunk 465.61→491.81 kB raw / 114.56→120.66 gz — budget bumped to
  493/121.5 with this justification; entry chunk untouched).

## [2026-10-13] — Insights Step-1 fix list (the 12 Oct audit) + the fx evidence artifacts

The owner's external audit of https://currena.ir/#/insights (snapshot dated
8–11 Oct 2026) produced a three-step fix list; this wave is **Step 1: fix
everything that is wrong on the existing page** — wrong or outdated numbers,
date handling, calculation and label errors, contradictions, hero verdict
mapping, stock-row presentation, forecast wording, trust/compliance items
and the data pipeline. No new indicators (except the core-CPI companion
line, which the audit itself asked for on the US inflation card); Step 2
(missing indicators) and Step 3 (live verdicts) stay future work.

### A. Wrong or outdated numbers — Fixed

- **Fed target range (A1).** The card now shows the TRUE published corridor
  from FRED's DFEDTARL/DFEDTARU ("3.75%–4.00%"), not a midpoint with a
  hard-coded 25bp skirt (the old render mixed the lower bound with the
  midpoint: "3.75% to 3.88%"). `value` carries the lower bound; the upper
  bound rides the new `rangeHigh` field.
- **Australian inflation (A2).** au-cpi/au-trimmed-mean switched from the
  retired quarterly keys to the **ABS monthly CPI** (CPI/1.10001.10.50.M +
  CPI/1.999902.20.50.M — live-verified: August 2026 annual **4.0% headline /
  3.6% trimmed mean**, exactly the audit's reference values). Cadence
  monthly; the card shows the DATA MONTH and the official release date.
- **US inflation (A3).** Core CPI (CPILFESL) joins the payload as a
  context companion rendered INSIDE the headline card — "Core inflation
  2.4% · The gap between them is mainly energy." — never its own row.
  The card's date speaks the data month + release date, never "Updated Jul 31".
- **RBA cash rate (A4).** The engine now reads the DAILY F1 "Cash Rate
  Target" (a decision-day move shows at once — the Sep-2026 hike reads
  4.60% from its effective date), with F1.1 monthly kept as the fallback.
  The savings money-row leads with the cash rate and wears a new
  piggy-bank artwork (the old row showed the inflation rate under a
  stock-exchange icon).
- **Other AU/US series (A5/A6, verify).** Verified against the live
  sources: wages/home-values/terms-of-trade already sit at 2026-Q2 (the
  audit snapshot predated the Q2 release), unemployment at August, M2 at
  August, US CPI at August (3.35% → 3.4%), govt-interest-revenue at the
  freshest BEA quarter FRED carries. The data-check evidence is in this
  wave's live verification.
- **Stock market dates (A7).** Every row and tile already shows its own
  last trading date; a market **more than one trading day behind the
  freshest close now wears a "Delayed" tag** (the honest name for the
  provider lag the audit caught on TSX/Ibovespa), and the weekend rule is
  pinned by a trading-day counter (never a Saturday/Sunday date).
- **Brent (A8) + Bitcoin (A9).** The tiles name their source AND contract:
  Brent's backbone is the EIA spot series (FRED), the live tile is
  front-month futures (BZ=F) on Yahoo Finance; gold/silver name their
  futures (GC=F/SI=F) over the gold-api spot backbone; Bitcoin names its
  Yahoo spot index. The live-merge attributions carry the same wording.

### B. Dates and calendar — Fixed

- **Decision days (B1).** The calendar dates were already decision days in
  the data; the one-day shift was a RENDERING bug — date-only ISO strings
  were parsed as UTC midnight and formatted in the browser's local
  timezone (behind-UTC viewers saw the FOMC on 27 Oct and the RBA on
  2 Nov). Date-only strings now format in UTC everywhere (core format.ts).
- **ABS CPI labels (B1).** "September quarter" → "ABS monthly CPI:
  September 2026" (all entries re-titled; the quarterly ids renamed).
- **US CPI calendar event (B4).** Added: 14 Oct 2026 (kind `us-cpi`), wired
  to the US inflation card.
- **Days away (B3).** Already computed at page load from today's date —
  the printed date was the bug (fixed above).
- **A date on EVERY card (B5).** Every card and row now carries its data
  date — "data for August 2026" for monthlies/quarterlies (the observation
  month, never the fetch date), "as of 9 Oct 2026" for dailies — plus the
  official release date when the new hand-maintained
  `data/insights-release-schedule.json` knows it (US CPI 11 Sep / 14 Oct;
  ABS monthly CPI 30 Sep / 28 Oct / 25 Nov), including Normal-state cards
  (the audit: terms of trade showed none).

### C. Calculation and label errors — Fixed

- **Gold/Silver per Bitcoin (C1/C2).** The old labels were inverted ("Gold
  per Bitcoin: 0.0509" is oz-per-bitcoin). Now: **"One bitcoin buys 19.6
  oz of gold"** / **"One bitcoin buys about 1,368 oz of silver"** — the
  display inverts the stored fraction, so the number always matches the
  sentence.
- **Gold/silver ratio (C3).** The ratio is recomputed at serve time from
  the SAME live snapshot the two tiles show (it was one generation behind
  and disagreed with the prices beside it).
- **Euro per US dollar (C4).** "US$0.8944" → **"€0.8944"** (fa: یورو).
- **Percentage points (C5).** Every rate-type series (US/AU CPI, trimmed
  mean, petrol, rent, wages, home-loan, govt-interest share) now expresses
  changes in POINTS; % stays for prices and indexes. The +88.1%/+35.6%/+12.7%
  relative-of-a-rate artifacts are gone.
- **"30-day" on monthly series (C6).** Monthly/quarterly changes are now
  computed vs the PREVIOUS RELEASE and labelled "since previous release".
- **M2 (C7).** "bn23,343" → **"US$23.3 trillion"** (+ its data month).
- **Savings row (C8).** See A4 — a real deposit-linked rate (the cash
  rate) with the right icon.
- **10-year position on trending totals (C10).** M2 and home values
  measure their 10-year position on YEAR-ON-YEAR GROWTH (the level-based
  percentile was permanently pinned near 100% just for rising); the cards
  say so.
- **Distance from the peak (C9).** Gold, silver, Brent and Bitcoin carry
  "x.x% below its 10-year peak" — the same honesty the stock tiles have.
- **Estimation chart (C11).** The delta now reads "−5.5% over the past
  quarter" — the window word is visible, clearly a past change.
- **Real yields (C12).** The daily staleness grace was tightened to stop
  the false "Stale/Cannot read" (FRED's H.15 series publish a day late);
  the gold card gained the audit's requested warning when gold sits near
  its decade high WHILE real yields are also high.

### D. Contradictions — Fixed

- **Status is the single source of truth (D1).** Consequence lines never
  claim a direction without a measured change (a high band + no measurable
  move now falls back to the neutral oneLiner — the old code called every
  unmeasured case "easing", contradicting the money panel's "becoming
  more expensive" on the same number).
- **Petrol (D6).** The money row's direction reads from the SAME rule that
  fired (brent's out-of-range rise rule ⇒ "Becoming more expensive", never
  "No clear direction" beside an oil warning).
- **ECB card (D3).** The policy-rate cards (ECB, Fed, RBA) state the SIZE
  OF THE MOVE as its own labelled line ("Recent move: +0.25 pts") beside
  the level line.
- **Inflation expectations (D4).** Re-backtested against the full FRED
  T5YIFR history (p50 2.18 · p80 2.30 · p95 2.40): the old top-20%-of-
  decade rule flagged 2.32% as "Needs attention" while the 2024–26 regime
  median sits at 2.26. New evidence rule: **above 2.4% sustained 4 weeks**
  — it fired exactly once in the decade (autumn 2023) and never on noise;
  the rule is shown on the card.
- **Oil in the hero count (D5).** Oil IS scored and the About section says
  so plainly (the copy no longer claims "prices are context, not scored").
- **Oil cause claims (D8).** "often war or supply shocks" → "usually war
  or supply shocks" (both locales).

### E. Hero summary and verdict words — Fixed

- **One mapping (E1).** The region verdict word comes from ONE count rule
  (in gauges.ts, used by both regions and displayed on the page):
  Critical = ≥2 areas critical or every area stressed-or-worse; Stressed =
  ≥2 areas stressed-or-worse or most areas cautious-or-worse; Cautious =
  any area above calm; Stable = all calm. The audit's exact snapshot now
  reads Australia [3,3,1] → Stressed (was "Cautious") and Global
  [4,1,1,1,1] → Cautious (was "Stressed").
- **Stock headline (E2).** The attention tier says **"Mixed: 5 of 16
  markets in correction"** — never a section-wide "Correcting" while 11
  markets are calm (the dedicated word returns with Step 3).
- **Calm areas named (E3).** Each hero lists its calm areas ("Calm:
  borrowing costs, market stress…") beside the stressed ones.

### F. Stock rows — Fixed

- **Column headers (F1).** The mobile row list gained the label header
  (Market · Today · 3 months · From 52-week high) + per-number sr-only
  labels; the desktop table always had them.
- **Trend word and number (F2/F3).** ONE flat threshold (±1%) for every
  market and view; the trend WORD and its ARROW both come from the number
  the row shows (3-month by default) — the DAX "+0.6% up-arrow labelled
  Down" mismatch is gone (the old word came from each market's 50-day MA).
- **Local currency (F4).** "Returns in each market's local currency" sits
  beside the view switch (and in About).
- **52-week distance everywhere (F5).** Every tile shows it — including
  S&P 500 and Nasdaq; a market at its high says "At its 52-week high".

### G. Wording, compliance and trust — Fixed

- **The forecast rename (G1/G2).** The card is **"Conditions for gold and
  silver"**, the strip says **"Conditions right now"**, and the verdict
  words are **"Supports / Works against / Mixed / Cannot read yet"** —
  "will go up / will go down" was a forecast and contradicted the page's
  own "conditions, not forecasts" line. The whole corpus was swept for
  "will / should / time to / expected to" (EN + FA) and the remaining hits
  rewritten as conditions.
- **Sources line (G3).** The accurate list: official publishers (Fed/FRED,
  BLS via FRED, ECB, RBA, ABS, World Bank) PLUS the market-data providers
  (Frankfurter, gold-api, EODHD, Yahoo Finance), with the licence-review
  note for commercial use.
- **Dollar basket (G4).** "Not the official DXY" rides the CARD itself
  (the oneLiner), not only the footer.
- **Backtest sentence (G5).** Appears once, and states its sample: "three
  crises — 2008, 2020 and 2022 — a small sample".
- **"Live" wording (G7).** The tiles' copy names hourly futures quotes on
  a daily backbone, and the page header shows **"prices updated HH:MM"**
  beside "Data as of {date}" (the live-prices clock is now served in the
  payload as `pricesAsOf`).
- **Disclaimer (G6).** Unchanged in content — the audit's ask (an
  Australian professional review before commercial use) is recorded in the
  About section's licence note and the docs.

### H. Data pipeline — Fixed

- **Stale tags (H1).** The daily grace moved 3 → 5 days (FRED's H.15
  series publish a day late; a Friday obs is legitimately 3 days old by
  the next ingest — production evidence: DGS10 obs 2026-10-08 reading
  `stale` on Oct 12 while FRED confirmed it was the freshest print that
  existed). Every card shows its stale tag when past its release schedule.
- **Relationship cards (H2).** The two "not enough fresh data" cards
  (incl. oil→expectations→borrowing costs) read again — their legs were
  the false-stale DGS10/DFII10 rows.
- **Fetch failures (H3).** A failed source now HOLDS the last good value —
  carried forward with its ORIGINAL asOf (never today's date) and marked
  `stale`; the ingest still exits red for P1 fetch failures (the operator
  keeps the signal, the reader keeps the number).

### Spec finish-line artifacts (world currencies)

- **The evidence run (§6.6, step 3)** — `pnpm --filter @currena/insights
  fx-evidence` replays 522 weeks (2016-10 → 2026-10) through the
  production rule engine: R1 7.5% of weeks / R2 2.9% / R3 11.7% / R4 6.5%
  / R5 15.3% / R6 4.0% (all under the 15% usefulness bar except R5,
  marginal — flagged for Ali), the known episodes (2018–19, March 2020,
  2022, Aug 2024, Apr 2025) all caught, and the pattern check tallies
  Holding/Mixed/Not-holding. Committed as
  `docs/specs/insights-world-currencies-evidence.md`.
- **The fx data check (step 0)** — both providers side by side for all 10
  pairs (10/10 within 0.5%, 4 exact). Committed as
  `docs/specs/insights-world-currencies-data-check.md`.
- The markets data-check gained its KV-usage record (§4 rule 9: ≤1
  write/day confirmed over the first five live days).

### Contract + budget

- `IndicatorReading` gains optional `rangeLow/rangeHigh/fromPeak10y/
  releaseDate`; the snapshot gains serve-time `pricesAsOf`; the calendar
  gains the `us-cpi` kind; `IndicatorDefinition` gains `percentileBasis`;
  +1 indicator id (`us-cpi-core-yoy`, context-only — the card companion).
- Insights lazy chunk 450.10/110.38 → **465.61/114.56** (budget bumped to
  469/115.5, itemised in scripts/check-bundle-budget.mjs; the entry chunk
  untouched at 290.37/87.83). 1,000 tests green across the monorepo
  (183 core + 67 scraper + 328 insights + 7 markets + 136 api + 279 web).

## [2026-10-13] — World currencies: the patterns section (direction B)

The Insights page's sixth dedicated section (insights-world-currencies-spec.md
v1.2, layout direction B chosen by Ali 2026-10-12): what the big currencies
are TELLING us — seven named patterns with two-part verdict sentences, the
pair numbers inside each pattern, and one table of all 10 pairs behind a
button. Verdicts first, numbers support them; no tile strip, no period
switch. Rebuilt end-to-end after the original build session's branch was
lost before it was ever pushed (the engine recovered verbatim from that
session's logs; everything else rebuilt from the spec).

### Added

- **The fx analysis engine** (`packages/insights/src/fx/compute.ts`) — pair
  derivation (crosses are code, never a call), the four period changes,
  `move_rank` (the "Unusually large move" tag), the reused Currena dollar
  basket as the "Dollar vs the world" measure (decision D-06: the repo's
  existing DXY-recipe basket, CAD+SEK join the provider call for it), the
  13-week pattern checks, the seven rules R1–R7 with the §6.4 downgrade
  pass (a Warning whose pattern is Not holding lately becomes a Watch and
  does not count), the distance-to-warning `progress` bars, and the §6.5
  section signal (0 counted = normal, 1–2 = attention, 3+ or the R4
  "confidence wobble" = unusual). Everything PURE and linear-time.
- **Provider adapters** (`fx/providers.ts`) — Frankfurter v1 (the frozen
  ECB-only API, ONE whole-currency timeseries call per run) with the Yahoo
  Finance chart fallback (8 currency calls, inverted where Yahoo quotes
  USD-per-currency); V1–V7 validation (a >5% one-day move needs both
  providers' agreement within 0.5% before it is believed).
- **The fx job + storage** — `insights:fx:v1`, ONE KV key, write-only-if-
  changed (content hash, never generatedAt); the cross-section reads (the
  stock legs from `insights:markets:v1`, gold from its history key, R1's
  fear leg from the stored market-stress gauges — decision D-05: no VIX
  exists in the repo). The job rides the currena-markets Worker's two
  existing cron triggers (spec §4.4's fallback: the account's 5-cron free
  limit is full), fault-isolated from the markets job. A `fx-run` manual
  seeder script (the REST "Path B") for initial population.
- **Market rows gain `chg1m`** — the 1-month change the currency rules read
  (S&P 500, Nikkei 225, Euro Stoxx 50). OPTIONAL in the contract: a stored
  snapshot written before this change simply lacks it, and the fx engine
  treats its absence as "input missing" (a nodata rule row), never a guess.
- **`GET /api/insights/fx`** — the stored snapshot read-only behind the
  spec's cache discipline (edge cache + `max-age=300, s-maxage=3600` +
  content-addressed ETag + 304s + the calm 503 `fx_not_ready` "being
  prepared" answer). One KV read per request; the full 10-pair payload
  stays well under the 20 KB budget.
- **The WorldCurrencies section** (§9 anatomy, direction B) — the §9.10
  measure-label verdict line + one §10.3 headline sentence; pattern cards
  (Level 1 collapsed rows, Level 2 opened: the 26-week two-line rebased
  chart + the warning line + the 13 dots with their end labels, Level 3 one
  tap deeper: why/seen-before/for-you + "Pairs used in this pattern" with
  the four periods); the quiet area (always one closest-to-warning row with
  a thin distance bar); Dollar at a glance; the 10-pair table behind
  "Show all currency pairs" (three group blocks, the big-move tag, old-data
  chips, the ▲ legend, a mobile row list) + the §9.4 pair detail panel with
  its 1-year chart. All §9.5 states (loading skeletons, the calm
  "being prepared" line, nodata rows, stale collapse). Time runs LEFT TO
  RIGHT in every chart and in the dots strip, even in Farsi (§9.6).
- **The §6.11 hero rebuild** — the stock section and the currency section
  are TWO SEPARATE indicators in the transparent count, each with its own
  measure label and chip (never merged: a calm stock section beside a
  warning currency pattern is the designed state — they measure different
  things). Raised currency signals join the named-alerts module with their
  PATTERN NAMES. Both world sections wear the shared SectionVerdictLine
  (measure label + the page's severity chip above the takeaway).
- **EN + FA copy** — the full §7 rule corpus (every outcome's two-part
  sentence), the §8 pair corpus (10 pairs + the dollar measure), §9.10's
  measure labels, §10.2's interface wording and §10.3's headline templates,
  spec-verbatim in both locales; Persian digits and the Iranian currency
  terms (جفت ارز، تقویت/تضعیف، پناهگاه امن…) per §10.1.
- **CSV export** — the pairs table's CSV joins the Tools menu (same
  discipline: ASCII values, localized headers, injection guard, CRLF).

### Budgets

- KV: ONE new key (`insights:fx:v1`); ≤3 writes/day (in practice 1 — the
  write gate skips unchanged days); page traffic rides the 1-hour edge
  cache in front of ONE KV read.
- Provider calls: ONE Frankfurter call per run; the 8-call Yahoo fallback
  only when the primary fails or a V3 second voice is needed. The combined
  markets+fx worst case is 41 subrequests per invocation (cap 50).
- Cron triggers: ZERO new (the fx job rides the markets Worker's two).
- Bundle: the Insights lazy chunk 377.70 → 450.10 kB raw / 97.20 →
  110.38 kB gz (budget 380/98 → 462/113, justified above); the entry
  chunk untouched.

## [2026-10-12] — Live prices: the volatility-scaled refresh (the stale-oil fix)

The Prices board showed Brent at $125.44 "as of 2026-10-06" for four-plus
business days while the real market traded near $107 — EIA's Brent spot on
FRED (the board's ONLY oil source) stopped publishing, the ingestion runs
once daily, and the 12-day stale grace meant nothing flagged it. Full story
and budget math: `docs/insights/09-live-prices.md`.

### Added

- **Hourly live quotes for the Prices board** — Brent `BZ=F`, gold `GC=F`,
  silver `SI=F`, Bitcoin `BTC-USD` from Yahoo Finance (keyless), stored
  under ONE new KV key `insights:prices-live:v1` (write-only-if-changed) by
  a new :13 minute rung of the currena-api minute cron. No new cron trigger
  (the account's free 5-cron limit is full). Per-asset refresh intervals in
  an owner-editable CONFIG block (`intervalMinutes`) — oil at 60 min is 24×
  the "at least once a day" bar. New module
  `packages/insights/src/prices/` (definitions/providers/job/store/merge) +
  a generic Yahoo chart adapter (`adapters/yahoo.ts`) + a manual
  `prices-run` seeder script.
- **Serve-time merge in `GET /api/insights`** — the four tiles + their
  companion ratios (`gold-btc`, `silver-btc`, `gold-aud`) carry the live
  values, asOf dates, 7/30-day changes and honest live attribution; a
  `stale`/`unavailable` reading heals to its natural status. The ETag
  covers both generations. A missing/poisoned quotes key degrades calmly to
  the plain EOD snapshot. The stored snapshot itself is never touched.
- **Ingestion gap-fill for Brent** — Yahoo's `BZ=F` daily closes extend the
  FRED series strictly past EIA's last published date (FRED stays
  authoritative on overlaps, so the series self-corrects when EIA catches
  up; a total FRED outage degrades to the Yahoo series). The stored
  history, percentiles and change windows can never rot behind a lagging
  EIA batch again.
- 53 new tests (46 insights + 7 api): parser, interval gating,
  hold-on-failure, write-if-changed, REST daily-cap retry, merge rules
  (never-rewind, status healing, schema validity), route merge + combined
  ETag, the :13 rung writing the KV key.

### Changed

- brent's attribution now reads `FRED (EIA Brent) + Yahoo Finance (BZ=F)`;
  the insights snapshot ETag format is
  `"insights:<generatedAt>+prices:<liveGeneratedAt|none>"`.

## [2026-10-12] — Money section: fa title verbatim + annual default window (owner round 43)

Forty-third round — two owner notes: "for part what it means for my money,
the farsi translation must be: رو هزینه‌های من چه تاثیری داره؟" and "also
the default time frame for this section must be annual."

### Changed

- **The money section's Farsi title is now the owner's exact wording** —
  «رو هزینه‌های من چه تاثیری داره؟» (was «برای پول من یعنی چه»). The EN
  title ('What it means for my money') is untouched.
- **The money rows' charts open on the ANNUAL window** — the shared trend
  panel gains a per-caller `defaultRange` (quarter remains the default
  everywhere else), and the money panel passes '1y': the «۱ سال» chip is
  pressed on load and the signed delta reads the 12-month move. The
  metals' Estimation charts keep their quarter default, and an explicit
  chip click still wins for the session.

## [2026-10-12] — fa verdict word: «محتاط» → «احتیاط» (owner round 42)

Forty-second round — a one-line owner note: "Instead of محتاط use احتیاط
for farsi."

### Changed

- **The Farsi *Cautious* verdict word is now «احتیاط»** — the label, the
  gauge rows' step word, the computed reason line and the four-word
  explainer sentence («چهار واژهٔ «پایدار»، «احتیاط»، «پرتنش» و
  «بحرانی»…») all read the new word, since every one of them flows from
  the single `label.cautious` copy string. EN ('Cautious') unchanged;
  historical changelog/PROGRESS mentions keep the old word as history.

## [2026-10-12] — The state's artwork leads the verdict row: [icon][word] (owner round 41)

Forty-first round — a one-line owner note: "the icons must before the state
like this [icon][stressed] — currently it's after the state."

### Changed

- **The hero verdict row reads [state-icon][state-word][meter]** — the
  state's artwork moves IN FRONT of the verdict word in both regions'
  verdict blocks (the old order rendered the word first, so the row read
  `[stressed][icon]`). The mark now opens the state moment in the same
  reading order as every other chip in the app — the status chips have
  always been icon-then-word. The meter stays last as the row's
  instrument. In fa the icon leads from the right edge (RTL reading
  order); in en from the left.

## [2026-10-11] — The hero attention tiles align into one row; unit labels read small (owner round 40)

Fortieth round — an owner note with a screenshot of the two hero verdict
blocks side by side: "This boxes need alignment, all must be in a same row"
(example: the Global Brent tile vs the Australia home-loan tile), followed by
"also read آمریکا (unit currency) smaller so it doesnt go to second row."

### Changed

- **The two regions' attention-tile rows share one horizontal band** — the
  count line + tiles + "+n more" + the "how is this computed?" link are now
  ONE bottom-anchored module inside each verdict block (a single `mt-auto`
  pins its top edge). The old free-floating tile block sat lower in the
  Australia panel (its gauge rows and reason sentence are taller) and the
  two rows zig-zagged; the free space now lives ABOVE the module, so both
  panels' tile rows start at the same y BY STRUCTURE (the alignment
  decree), measured pixel-equal in both locales.
- **Tile faces are geometry-fixed** — the name row is EXACTLY two lines
  (`h-[2.75em]`) with the indicator's artwork moved out of the text flow
  (a flex sibling can no longer inflate the line box — the old inline 24px
  icon made two-line titles 41px vs 34px and pushed that tile's value 7px
  below its neighbours); the meaning line is clamped to three lines with
  the same three-line reserve, so every tile is the same height across
  both regions and the meanings' edges align.
- **Unit labels read small** — value rendering gains `indicatorValueParts`
  (number/unit split; `formatIndicatorValue` is now the exact join of the
  parts, outputs byte-identical everywhere). In the tiles the number keeps
  the 23.2px number role while word-units ('دلار آمریکا', 'pts') render at
  caption size on the number's baseline — '۱۲۵٫۴۴ دلار آمریکا' stays on
  ONE row at every desktop width from ~1110px up (the old full-size unit
  wrapped it to two rows). Percent signs and prefixed 'US$' stay glued to
  the number as before. Below ~1110px the unit wraps as a whole word-block
  under the number (the 3-across tile band 768–1130px physically cannot
  fit a 90px number plus a word-unit — pre-existing geometry, and the
  tile faces stay tidy when it happens).
- Tiles tighten half a step to make the row fit (`px-3`→`px-2`, tile grid
  gap 6→4px, value gap 6→4px, unit weight 700→600) — the owner's ~1136px
  viewport now carries ~5px of slack instead of a knife edge.

### Verified

- Gates: typecheck 5/5; tests 804/804; build ✓; bundle budgets held
  (Insights 332.35/85.76 vs 334.00/86.00; entry 290.33/87.83).
- Local QA (wrangler :8787, KV from prod): en + fa, light + dark, at 1280 —
  both panels' tile rows pixel-equal (ul top 457 = 457, tile heights
  137 = 137, values all at y 501, one line 31px each); the fa Brent tile's
  'دلار آمریکا' reads small on the number's baseline (top 511 vs 501 —
  same row); 1136 — rows still pixel-equal, oil value one line with ~5px
  slack; 375 — single-column tiles, no horizontal overflow; "+n more"
  reveal works in place (3→5 tiles); how-link pinned 16px off the panel
  bottom in both blocks; zero page errors, zero console errors.
- Release: commit + staged-diff token scan clean, pushed via one-shot PAT
  URL, wrangler deploy, production verified (health, chunk byte-compare,
  live browser pass).

## [2026-10-11] — Each region's metrics move into their own mother container (owner round 39)

Thirty-ninth round — an owner note with a screenshot of the Global section:
"put all of global metrics inside a mother container, currently the heading
of global looks stray, it needs depth and container", followed by "australia
must have separate mother container."

### Changed

- **Each region section is its own mother container** — the Global heading
  (and its 96/128px artwork) no longer floats on the page background with
  the metric cards scattered under it. The whole section — heading +
  artwork + every question group, alert/connection cards and the
  "show all" affordances — lives INSIDE one rounded container: the soft
  family tint (`currena-soft/60`, the same field the no-match box wears),
  a hairline ring and a quiet shadow for depth. Three visual layers now:
  page background < tinted mother container < white metric cards.
- **Australia gets a SEPARATE container** — by structure, not luck: the
  section map renders one `<section>` per region, so the two boxes can
  never fuse; measured 40px of page between Global's bottom edge and
  Australia's top edge, both the same width and column edge in both
  locales.
- Gold stays reserved for the money panel's focal treatment — the regions
  take the neutral depth. Anchors (`insights-section-*`), aria labelling,
  scroll margins and everything inside the containers are untouched.

### Verified

- Gates: typecheck 5/5; tests 804/804; build ✓; bundle budgets held
  (Insights 331.78/85.21 vs 334.00/86.00; entry 290.33/87.05).
- Local QA (wrangler :8787, KV from prod): en light + dark at 1280 — both
  containers render with tint/ring/shadow, heading + artwork inside each
  (Global 10 groups, Australia 6), separate boxes with a 40px gap, same
  width 1088 and left edge 96; fa RTL — both containers right-aligned at
  the same edge (1184), boundary screenshot shows the two boxes stacked;
  375: docW = clientW = 375, container 343px with 16px inner padding; zero
  page errors, zero console errors. Screenshots r39-local-*.png.

## [2026-10-11] — The money rows' type steps down to proportional (owner round 38)

Thirty-eighth round — one owner note on the round-37 sizes, with a
screenshot: "Now they're too big, make them proportional."

### Changed

- **The heading and the number return to proportional steps** — the
  round-37 scale (28px heading / 29px value) shouted against the 14px
  sentence. The area name steps down to 1.5× the body
  (`calc(var(--type-label) * 1.5)` = 21px, still bold) and the value
  returns to the page's number role (`type-number` = 23.2px / 800 /
  tabular — the attention tiles' role, and the size the owner approved
  in round 36). The column reads heading (21) → estimation word (14
  bold) → value (23.2, still the biggest line) → sentence (14), every
  step a token or an existing role — no arbitrary px. A side effect the
  owner gets for free: value + explanation now fit ONE line again in
  most rows (the 29px forced the explanation to wrap).
- Nothing else moves — the one-column-beside-the-icon layout, the
  shared column edge per row, the 50/50 data|chart split and the dedupe
  are all untouched.

### Verified

- Gates: typecheck 5/5; tests 804/804; build ✓; bundle budgets held
  (Insights 331.61/85.14 vs 334.00/86.00; entry hash moved with the
  chunk rename, size identical 290.33/87.05).
- Local QA (wrangler :8787, KV from prod): en + fa at 1280 — name
  21px/700, value 23.2px/800, name/dir/value on one column edge ×4 rows
  (en left 236, fa right 1044), value inside the icon band ×8, fa chart
  half still left of the data half; 375: docW = clientW = 375, value on
  one line (189px wide); zero page errors, zero console errors.
  Screenshots r38-local-*.png.

## [2026-10-11] — The value moves up beside the icon; the numbers and headings grow (owner round 37)

Thirty-seventh round — three owner refinements to the money rows, each with
a mockup: "move the text to inside the approx red rectangle i drawn" (the
empty band under the direction word, beside the tall icon box); "also make
the percentage text size 25% bigger"; and "also make the headings such as
«پس‌انداز و بهره» 100% bigger — for example if it's 12px make it 24px".

### Changed

- **The value lines move INTO the name/direction column** — the supporting
  number lines no longer sit in their own row under the icon box; they are
  the third line of the column beside it (name → direction word → value),
  exactly where the owner drew the red rectangle. The dead vertical band
  that used to sit under the direction word is filled: the value's top now
  lands INSIDE the icon box's band in every row (verified 4/4 in both
  locales), and the sentence still starts at the half's edge below.
  Alignment gets STRONGER, not weaker — the name, the direction word AND
  the value now share one column start edge per row (left 236 ×4 in en,
  right 1044 ×4 in fa), by structure.
- **The value grows 25%** — 23.2px → 29px via
  `calc(var(--type-number) * 1.25)`: a token ratio, not a magic px, so the
  number role scales if the type scale ever moves. Weight stays 800 with
  the NUMBERS, tabular digits, one line (never breaks mid-text).
- **The area name is a real heading** — 2× the label role
  (`calc(var(--type-label) * 2)`, 14px → 28px, still bold, snug leading
  for the Persian ascenders). The row now reads heading → estimation →
  number → sentence, the owner's mockup order, in both locales.

### Verified

- Gates: typecheck 5/5; tests 804/804; build ✓; bundle budgets held
  (Insights 331.68/85.16 vs 334.00/86.00 — class strings only; entry
  untouched 290.33/87.05).
- Local QA (wrangler :8787, KV from prod): en/fa × light/dark × 1280/375
  — name/dir/value on one column edge ×4 rows, value inside the icon
  band, name 28px/700, value 29px/800, explanation 14px/400; fa chart
  half still left of the data half; 375 stacks with docW = clientW = 375
  and the value unbroken; zero page errors, zero console errors.

## [2026-10-11] — The numbers lose the pill; the small grades lose the rainbow (owner round 36)

Thirty-sixth round — three owner points with screenshots: the money rows'
supporting chips should move and change shape ("first write the percent in
bigger and bolder text, then write the explanation of it smaller with
regular text … delete the chip like alternative"); "find it why those both
boxes show «قیمت‌های استرالیا نسبت به سال قبل» — is this correct?"; and
the hero's small grade meters: "Align this 6 boxes. also it's too visual
noise … use normal color not color coding."

### Changed

- **The money rows' numbers are plain text, not pills** — the supporting
  chip row is gone from the bottom of the data half. Each supporting
  number now sits BETWEEN the name/direction line and the sentence,
  spoken the owner's way: the VALUE in the page's number role
  (`type-number` — 23px / 800 / tabular, the same role as the attention
  tiles' numbers) and the indicator name after it smaller (label size)
  at REGULAR weight. Value first in the DOM → rightmost in fa (the
  owner's mockup), leftmost in en. The line still opens the indicator's
  card — the pill's one job survives, its look is gone. The value never
  breaks mid-text (`whitespace-nowrap`); on phones a long name wraps
  below the value instead.
- **Each supporting number shows ONCE** — the owner's duplication
  question, answered: savings AND shop both legitimately read Australia
  CPI (config lists it for both), so when CPI left its usual range BOTH
  rows picked it as their first driver — correct per the data, but the
  same «قیمت‌های استرالیا نسبت به سال قبل» twice read as duplication.
  Display-level dedupe: the later row falls through to its NEXT driver
  (shop → underlying inflation, «تورم زیرین ۳٫۶٪»), and the row's chart
  follows the number it actually shows (shop's mini chart is now the
  trimmed-mean series — arguably the better chart for shop prices
  anyway). If every chip was already shown, a row re-shows its own — a
  row never loses its number or its chart.
- **The hero's grade boxes align BY STRUCTURE** — the wrap is gone: the
  gauge name owns the row's free width and truncates with the full text
  on hover (title) and in the meter's aria (the old wrap made
  "Borrowing costs" rows 42px while single-line neighbours sat at 21px —
  the boxes zig-zagged). Every row is exactly one line high; tightened
  the column/element gaps (gap-x-5, gap-1.5) so even the longest short
  names ("Borrowing costs", "Inflation & rates") fit without
  truncating at card width.
- **The small grade meters are NOT colour-coded** — "use normal color
  not color coding": the six small meters' filled segments render in one
  normal ink (text-secondary) in light and dark, and the step words sit
  in the same normal ink instead of the status palette. The colour
  coding stays where it belongs — the hero's BIG meter and verdict word.

### Housekeeping

- No bundle movement that matters: Insights 331.50/85.14 vs budgets
  334.00/86.00; entry untouched 290.33/87.06.

## [2026-10-11] — The money rows' mini graphs shrink to half the card (owner round 35)

Thirty-fifth round — one owner point on the round-34 money charts, with a
sketch: "This graphs are too big, it must only contain 50% of the card
width, 50% other data and context like this [ graph       data]".

### Changed

- **The money rows are a 50/50 grid** — the mini chart no longer spans
  the full card on its own wrapped line. Each row is now
  `sm:grid-cols-2`: column 1 (inline-start) is the DATA half — icon +
  name/direction on the first line, the sentence and the supporting
  chips stacked under them — and column 2 is the CHART half, the same
  TrendPanel (axes + hover inspector + Quarter/1y/5y chips + delta,
  plot h-16) vertically centred in its half like the metals' chart
  columns, separated by a vertical hairline (`border-s` faces the data
  half in both directions). In fa/RTL the chart lands on the LEFT and
  the data on the RIGHT — exactly the owner's sketch; en mirrors it,
  the same label-start/chart-end pattern the Estimation strip already
  uses. Phones (<sm) keep the round-34 stack: hairline above, chart
  full-width under the data.
- **The divider is aligned BY STRUCTURE (the decree)** — `grid-cols-2`
  makes the split exact and equal in every row: verified chartLeft =
  648 / dataLeft = 128 / chartRight = 1152 across ALL FOUR rows
  (petrol, homeLoan, savings, shop), each half exactly 504px at 1280,
  and each row's two halves stretch to the same height (186 = 186).
  The sentence starts at the half's edge in every row, so the R30
  "sentences start at different positions" roast stays fixed.

### Housekeeping

- No bundle movement that matters (class strings only): Insights
  331.44/85.10 vs budgets 334.00/86.00; entry untouched 290.33/87.05.

## [2026-10-11] — Real axes and a hover inspector on every chart; the money rows wear the same mini graphs; alignment by structure (owner round 34)

Thirty-fourth round — the owner's follow-up on round 33's charts: "the gold
and silver graphs must have X and Y axis, also when you hover mouse on
graph, it must show price points during the times"; "add graphs with same
structure" to the "What it means for my money" rows as mini graphs; the
copper move chip «نسبت مس به طلا بالا می‌رود» is "somehow vague — write
more intuitive and practical text like: قیمت مس نسبت به طلا رشد می‌کند";
and the standing decree: "Always comply alignment rules, so such incidents
must never happen."

### Added

- **X and Y axes on every trend chart** — the round-33 sparklines grew a
  real frame: three dashed horizontal gridlines (top/mid/bottom) with Y
  tick labels at the line's max / mid / min (compact by magnitude —
  "4,411" / "65.4" / "3.95"; Persian digits in fa), and X tick labels at
  the window's first / middle / last point (en "Aug 2026 → Oct 2026",
  fa Jalali «مرداد ۱۴۰۵ → مهر ۱۴۰۵»). The gridlines and labels are
  positioned from the SAME scaleY geometry that draws the line, so a
  gridline always sits exactly on the value its label names, and every
  label renders as HTML (never stretched-glyph SVG text).
- **A hover price inspector** — moving the mouse over a plot (or tapping
  it) snaps a crosshair + dot to the nearest point and floats a tooltip
  with the exact price point and its date ("US$4,108 · Oct 7, 2026";
  fa «۴٬۱۲۸ دلار آمریکا · ۱۶ مهر ۱۴۰۵», units from the indicator's own
  formatter). The plot is also focusable and keyboard-walkable
  (←/→ step, Home/End jump, Esc clears), so the numbers are reachable
  without a mouse. Tooltips clamp inside the plot edges.
- **Mini graphs on the money rows** — every "What it means for my
  money" row now carries the EXACT same structure as the metals'
  Estimation charts (shared TrendPanel: axes + hover inspector + the
  Quarter / 1 year / 5 years chips + the signed window delta), rendered
  as a full-width mini chart on its own hairline-separated line under
  the row. It charts the row's FIRST chip — the indicator actually
  making the row speak (petrol → Brent +64% quarter, home loan → the
  paid rate, savings & shop → CPI) — so the picture and the sentence
  can never disagree. No-series rows keep the honest "no chart history"
  line; a Quarter chip disables itself when the window holds <2 points
  (quarterly CPI).
- **TrendChart.tsx** — the shared module behind all of it (chart + axes
  + inspector + chips + delta + the module-cached history hook), so the
  two sections stay aligned by construction.

### Changed

- **Alignment is structural, never lucky (the decree)** — three fixes:
  (1) the Estimation strip's verdict words own a fixed two-line slot
  (silver's «جهت روشنی ندارد» wraps, gold's «پایین می‌آید» doesn't — the
  slot keeps both tiles' verdicts, chips and deltas on the same
  baselines; verified chipsTop/deltaTop identical across tiles); (2) the
  chart column owns a reserved height so loading/empty states can't pull
  one tile's rows above the other's; (3) the connection cards' focal
  verdict fields anchor to the card's BOTTOM (mt-auto) — cards in a row
  stretch to equal heights, so all three gold fields finish on the same
  baseline instead of floating where the upper content happens to end.
- **Charts hold their time direction in RTL** — the whole TrendPanel
  block lays out dir="ltr" (the house chart convention): Y labels left
  of the plot, X ticks running left→right matching the SVG line — the
  first date's label sits under the line's FIRST point in fa too, not
  mirrored onto its end. The card layout around the chart still mirrors.
- **The copper move chip speaks plainly** — «نسبت مس به طلا» →
  «قیمت مس نسبت به طلا» (chip now reads «قیمت مس نسبت به طلا بالا
  می‌رود», the owner's own example shape; the page-wide بالا می‌رود /
  پایین می‌آید vocabulary stays). en "the copper-to-gold ratio" →
  "the copper price vs gold" (chip: "the copper price vs gold rising").
  The details panel's typical line joins ("The copper price vs gold
  sits in its usual range." / «قیمت مس نسبت به طلا در محدودهٔ همیشگی
  است.»). The prose explanations keep the ratio wording (that's what
  prose is for). One new shared aria key, `trendChartAria` («روند قیمت
  {name}، {range} گذشته»), × 2 locales.

### Housekeeping

- Budget bump 330.00/85.50 → **334.00/86.00 kB gz** (Insights
  331.29/85.09): the shared chart engine (axes + inspector + the money
  minis) is exactly the growth the owner asked for on TWO sections;
  gzip +1.09 kB. The R33 entry pre-announced the bump. Entry chunk
  untouched (290.33/87.06 vs 296.00/89.50).

## [2026-10-11] — The big icons move to the dedicated sections; the Estimation chips wear the metals' own charts (owner round 33)

Thirty-third round — five owner points: the 128px world/australia maps in
the HERO are "visual noise" (max 64×64 up there; the big icons belong
"here in the middle of page of global and australia" — the screenshot
points at the dedicated `Global` section heading); the Estimation chips'
white space should carry "gold and silver chart … quarter, one year,
five year time frame by clickable chips"; the Global | Australia switch
bar must go from the top of the page ("also it doesnt work"); and the
"+2 more" tile "doesnt show other indicators".

### Changed

- **The switcher is retired — both regions render, stacked** — the
  Global | Australia pill bar is gone from the page entirely (it sat
  above the fold flipping a state the reader could not see: clicking it
  re-rendered a section below the fold and read as dead). The dedicated
  sections now render TOGETHER mid-page — Global first (D7), then
  Australia — each headed by its own name; `insights-section-global` /
  `insights-section-australia` are static anchors, so the hero's "View
  section" links and the Tools counts behave honestly (counts describe
  everything on screen again). LaneSwitch.tsx + the lane storage key are
  deleted.
- **The big region icons live on the section headings** — each dedicated
  section's h2 leads with its artwork at the price tiles' scale (96px
  mobile / **128×128 desktop**) beside the name: the globe for Global,
  the map for Australia. This is where the owner wanted the big icons —
  the screenshot's heading — not the hero.
- **The hero mark steps back down** — the verdict blocks' region icon is
  a quiet 48px mobile / **64×64 desktop** (the owner's hard ceiling),
  silencing the visual noise the 128px artwork made at the top of the
  page.
- **The Estimation chips' white space is now the metals' own history** —
  each verdict chip pairs its 128px artwork (left column: artwork, name,
  verdict word) with a compact zero-dependency SVG trend chart (the
  house Sparkline pattern, dir="ltr" in both locales) that fills the
  former white space on desktop and sits under the artwork on phones.
  Under the chart: CLICKABLE range chips — **Quarter · 1 year · 5 years**
  (en) / «سه‌ماهه · ۱ سال · ۵ سال» (fa) — default Quarter, disabled when
  the window cannot show ≥2 points, plus one signed window delta
  («+130.3%», quiet ink — the verdict word beside it already speaks in
  colour). Data rides the same module-cached `/api/insights/:id/history`
  fetch the details panel uses; a 404 degrades to the honest "no chart
  history" line.
- **"+n more" now shows the indicators** — the hero's needs-attention
  overflow tile used to jump to the (removed) switcher's lane, which
  read as a dead click. It now reveals the remaining tiles IN PLACE
  (the grid wraps; the button disappears once everything is shown).

### Housekeeping

- Insights chunk 326.09/84.00 kB raw/gz against the previous 322.50/84.00
  budget — OVER by 3.59 kB raw (gzip grew ~1 kB), so the budget bumps to
  **330.00/85.50** with this note (the R32 entry pre-announced the first
  additive bump). The growth is the strip charts + chips, the dual
  sections and the reveal state — logic and JSX, not strings. ENTRY
  chunk untouched (290.33/87.05 vs 296.00/89.50). PWA precache unchanged
  (85 entries).

## [2026-10-11] — Plain direction words, no stuttered rows, big region marks, and the connections' focal verdict field (owner round 32)

Thirty-second round — five owner points: "instead of 'ارزش می‌بازد' say
'پایین می‌آید' or will go down"; the condition rows' duplicated state word
("علیه کار می‌کند / دلار آمریکا / علیه کار می‌کند"); "علیه کار می‌کند is not
a good translation — use در تضاد است or در جهت مخالف است"; the dedicated
Australia and Global sections should wear their big icons; and the
connections' moves ("نسبت مس به طلا بالا می‌رود…") need "a container inside
a container as focal point for the verdicts and estimations".

### Changed

- **The Estimation speaks plainly again** — the verdict words are back to
  the owner's own R23 phrasing: "will go up" wears green, "will go down"
  wears red (fa: «بالا می‌رود» / «پایین می‌آید») — R26's "gaining/losing
  value" («ارزش می‌گیرد/می‌بازد») are retired. The page now speaks ONE
  direction vocabulary: the verdict chips, the collapsed summary takeaway
  and the connections' move lines all use the same words. Colour still
  never rides alone: the zigzag/flat icon leads every word.
- **The condition rows lost their stutter** — each row used to render the
  state word twice (icon + short word at the start, then the full word
  again after the name; in fa the two strings for "against" were
  IDENTICAL, so every against-row read «علیه کار می‌کند / دلار آمریکا /
  علیه کار می‌کند»). The trailing echo is gone — the icon + word at the
  row's start IS the state. Verified: exactly one occurrence per row in
  both locales.
- **"works against" is now «در تضاد است»** — the fa wording the owner
  rejected is replaced across the signals copy (group heading, state
  words, and the real-yield "how" sentence's closing clause → «در تضاد
  با آن است»). English "Works against" is untouched.
- **The Global and Australia blocks wear their big icons** — the hero's
  region verdict cards (the dedicated sections) now lead with their own
  artwork at the price tiles' scale (96px mobile / **128×128 desktop**),
  the section label and the view link sitting beside it, vertically
  centred — the same face the Estimation chips and the price tiles speak
  with.
- **The connections have their focal verdict field** — when a connection
  card has estimations to show (active/partly), the right-now verdict and
  the per-leg moves move INTO the app's focal container-inside-container
  recipe (the money panel's / the Estimation strip's): the card holds a
  brand-gold gradient field with a 2px gold ring and gold-tinted shadow;
  the field holds the verdict line and the moves as WHITE CHIPS, each
  riding a direction glyph — up/down arrows for rising/falling, the dash
  for steady, and a position dot for level-only legs (high/low/mid — a
  level is not a movement). Quiet states (inactive/unknown) keep the
  plain one-line verdict.

### Housekeeping

- Copy-only + presentation change; no engine, API or asset changes.
  Insights chunk 322.43/83.03 kB raw/gz against the 322.50/84.00 budget —
  HELD with 0.07 kB to spare (the next additive round likely bumps; noted
  here so the bump is never silent). PWA precache unchanged (85 entries).

## [2026-10-11] — The Estimation strip becomes the card's verdict; "expensive" speaks in red (owner round 31)

Thirty-first round — two owner points: the gold-and-silver card's verdict
strip must be "contrasted with more visual weight against its section,
because it's the verdict and estimation of the whole section", with its
icons at 128×128 on desktop; and "everywhere which is marked 'expensive'
use red color".

### Changed

- **The Estimation strip is the focal takeaway** — the app's focal-section
  recipe (the money panel's, round 29) now wraps the strip: a brand-gold
  gradient field (16% → 7% → transparent), a 2px gold ring, and a
  gold-tinted shadow (dark mode keeps the gradient with a deeper shadow),
  so the white verdict chips pop against the card they summarise. The
  strip's title lifts to secondary ink for the tinted field.
- **Verdict chips restacked around the artwork** — each chip is now a
  small stacked card: the metal artwork leads at the price tiles' scale
  (96px mobile / **128×128 desktop**), the metal name rides under it, and
  the verdict word ("losing value" / "no clear direction" / «ارزش
  می‌بازد»…) speaks at the price's own size (type-number) in the verdict
  ink — icon + word, never colour alone. The direction zigzag grows with
  the strip (28/36) beside the big word. Header lean lines, footing rows
  and the collapsed summary keep their own smaller scales.
- **"expensive" is red (owner decree, R31 restores the pre-R30
  valence)** — `bandToneClass` maps the price position band to status
  ink again: expensive (top of the 10-year range) = the alert red, cheap
  (bottom) = the supportive green, typical stays neutral. It colours the
  price tiles' change-row word AND the details panel's 10-year position
  word (price rows). Never colour alone: the word always rides beside
  the change numbers / the position bar.

### Housekeeping

- No copy, engine or API changes. Insights chunk 321.10/82.94 kB raw/gz
  against the 322.50/84.00 budget (no bump). No new assets — PWA precache
  unchanged (85 entries).

## [2026-10-11] — Price tiles: the artwork IS the card, at 128×128 on desktop (owner round 30)

Thirtieth round — the owner checked production, found it still serving the
round-28 markup (the round-29 commit had not left the sandbox), and set the
next bar: "The icons look like before… The main prices … must have at least
128×128 icon in pc." Two jobs: actually ship what is committed, and make the
price tiles' artwork a true 128×128 face on desktop.

### Shipped (the round-29 backlog)

- Commit `0225cc0` (round 29) had been gated, browser-verified and committed
  locally, but NEVER pushed or deployed — the sandbox had no GitHub token and
  no Cloudflare token, and the remote URL is tokenless by design. The owner
  supplied both credentials this round; the release record below covers the
  combined round-29 + round-30 push and deploy.

### Changed

- **Price tiles restacked around the artwork** — the icon box grew to
  96px on mobile / **128×128 on ≥640px screens** (owner's explicit floor;
  the 256px sources downscale cleanly), and the tile turned into a stacked
  product card: artwork on top as the face, then the name, then the big
  price, then the change rows. The old side-by-side arrangement could not
  survive a 128px neighbour: at the 4-across desktop grid only ~100px
  remained beside the icon, and in fa the price («۴٬۱۹۶ دلار») wrapped to
  THREE lines while names wrapped to two — rows started at different
  heights per tile, exactly what the owner's "numbers must align" rule
  forbids.
- **Alignment is now structural, not lucky** — the name rides in a fixed
  two-line slot (`min-height: 2 × leading-snug`), so the price and every
  row under it start at the same y in all four tiles whether a neighbour's
  name wraps or not. Verified programmatically in en and fa at 1280:
  name/price/change tops are pixel-identical across all four tiles.
- The fallback `Coins` glyph (only shown if artwork is ever missing) joins
  the responsive `.currena-icon` mechanism at the same 96/128 sizes.

### Housekeeping

- No copy, engine or API changes. Insights chunk 320.73/82.91 kB raw/gz
  against the 322.50/84.00 budget (no bump). No new assets — PWA precache
  unchanged (85 entries).

## [2026-10-11] — Icons at full voice, and the money panel becomes the page's focal section (owner round 29)

Twenty-ninth round — three owner points at once: "the icons are too small —
I expect them to be a few times larger on desktop, and relatively larger on
mobile"; a list of which icons/subjects are still missing; and "what it means
for my money needs more contrast and visual weight — different bg, color,
shadow, anything — it is one of the most important sections".

### Changed

- **Responsive artwork sizing (`IconImg` + `.currena-icon`)** — the fixed
  inline `size` px became two CSS custom properties set per image: the
  MOBILE box (`--icon-size`) and the ≥640px box (`--icon-size-sm`,
  Tailwind's `sm:` breakpoint — the same one every money/price row already
  turns at). One media query in index.css drives every artwork surface;
  `object-fit: contain` keeps the 256px sources clean at every size.
- **Every surface grew (mobile → desktop, old desktop in brackets):**
  money-panel area icons 52 → 80px in a 64 → 96px box (40 in 64), price
  tiles 32 → 44px in a 44 → 56px box (26 in 36), the hero's state artwork
  44 → 60px (30), the gold-and-silver estimation strip's metal chips +
  direction zigzags 28 → 36px (20/18), its footing rows 24 → 30px (18) and
  header lean lines 18 → 22px (16), hero region marks 22 → 28px (18),
  hero attention tiles 20 → 24px (16), alert-card titles 26 → 34px (20),
  details-panel headings 32 → 44px (24), and the money rows' estimation
  arrows 20 → 24px (16). The money panel's estimation arrow and word now
  read at the row's own scale, not as a footnote.
- **The money panel is the focal section** — the app's focal accent
  (brand gold, round 24's decision) now wraps "What it means for my
  money": a gold gradient field (16% → 7% → transparent), a 2px gold
  ring, and a soft gold-tinted shadow, with its own padding so the white
  rows sit ON the tinted field — the wrapper-vs-rows contrast carries the
  weight, the rows keep their plain readable surface. Dark mode keeps the
  same gradient logic with a deeper shadow. Row rhythm opened one step
  (gap-2, py-3.5, px-4) to match the larger icons.

### The missing-icon audit (owner question 2)

Subjects that exist in the app but have NO artwork yet, by priority:

1. **Jobs / worker / briefcase** — the money panel's one icon-less area
   ("jobs" still wears the old stroke briefcase) + `au-unemployment`.
2. **Wages / pay packet** — `au-wage-growth`.
3. **Central bank building** — `fed-target`, `ecb-dfr`
   (`rba-cash-rate` currently borrows the housing art; a bank of its own
   would let policy rates read as policy).
4. **Government / treasury** — `govt-interest-revenue`.
5. **Strong dollar (a $ with directional arrows)** — `dollar-basket`.
6. **Flags: US, Japan, EU, China, Australia** — the five FX pairs
   (`usdjpy`, `eur-usd`, `usdcny`, `audusd`, `audjpy`); the converter
   already speaks flags, the Insights lanes don't yet.
7. **China factory** — `china-pmi`.
8. **Money supply (banknotes stack)** — `m2-us`.
9. **Nervous-market gauge (distinct from the four state gauges)** —
   `stress-stlfsi`, `nfci`.
10. **Inflation expectations (a coin + a clock)** — `breakeven-5y5y`.
11. **Container ship / trade** — `terms-of-trade`.
12. **Iron ore (rock / mine cart)** — `iron-ore`.
13. **A wallet/purse for the money-panel header** — optional, the section
    currently relies on the gold field alone.
Not needed: `gold-silver` (the two bars already ride the ratio row),
`gold-btc`/`silver-btc` (context ratios, tiny), `au-us-10y-gap` (covered
by the US-10Y family art).

### Housekeeping

- No copy, engine or API changes; the estimation engine (round 25) and
  the copy corpus are untouched. Insights chunk 320.69/82.87 kB raw/gz
  against the 322.50/84.00 budget (no bump — the responsive sizing is
  ~0.8 kB of JS + 21 lines of CSS). No new assets, so the PWA precache
  is unchanged (85 entries).

## [2026-10-11] — The owner's icon set: the app wears its own artwork (owner round 28)

Twenty-eighth round — the owner shipped "Currena PNG Icons.zip" (18 pieces,
256×256, carefully named) with the instruction: create a proper assets
folder, move them under it, use them everywhere possible ("everywhere you
see gold use gold.png"), keep sizes flexible (sources support up to
256×256), and keep the SAME colour coding the finance states already speak
(cautious etc.).

### Added

- **`apps/web/public/assets/icons/`** — the 18 pieces with web-friendly
  lowercase-kebab names (gold.png, silver.png, oil.png, bitcoin.png,
  copper.png, fuel-price.png, bills-shop-prices.png,
  home-loan-rent-interest.png, stock-exchange-index.png,
  us-10-year-interest.png, global-finance.png, australia-map.png,
  stable/cautious/stressed/critical-state.png,
  up-support-growth-increase.png, down-work-against-decrease.png). The
  original zip is archived at `docs/icon-source/`.
- **`components/icons/currena.tsx`** — one shared module: the URL maps
  (indicator → subject, money-area → subject, section → region mark,
  verdict step → state) and the one decorative `<img>` shape
  (alt="" + aria-hidden — the adjacent word always carries the meaning).

### Changed

- **Price tiles**: the round-24 stroke pictograms are gone — oil barrel,
  gold bar, silver bar and bitcoin wear their own artwork in the same
  tinted boxes (gold keeps the brand-gold box).
- **Money panel**: five of six areas wear artwork (fuel nozzle, housing,
  the rising chart for savings, bills, the globe for overseas); "jobs"
  has no artwork yet and keeps its stroke briefcase.
- **Gold-and-silver card**: the metal chips, the header lean lines and
  the footing rows show the gold/silver bars; the metals' up/down
  estimation arrows are the owner's green/red zigzag artwork (their fixed
  colours match this card's holder-view valence by construction — up =
  gain). The flat dash stays a stroke glyph; the money panel keeps its
  stroke arrows (there "up" can be the BAD case and must follow the
  area's valence ink).
- **Hero verdict cards**: each region wears its mark (globe = Global,
  map = Australia), and the big verdict word is beside its state's
  artwork — drawn in the SAME colour coding the app already speaks
  (green Stable ↔ the normal ink, amber Cautious ↔ the watch ink, orange
  Stressed ↔ the stressed ink, red Critical ↔ the alert ink). Icon +
  word + ink, never colour alone.
- **Alert cards, hero attention tiles and the details panel**: every
  mapped indicator (oil, gold, silver, bitcoin, copper, the US-10Y
  family, the CPI/bills family, the housing family, petrol) names itself
  with its artwork.

### Housekeeping

- No copy, type, engine or API changes. The icons are static public
  assets — no JS cost; the Insights chunk moved 319.87/82.62 kB raw/gz
  against the 322.50/84.00 budget (no bump). The PWA precache now
  includes the 18 PNGs (85 entries, ~2.7 MB) — same mechanism the flag
  images already used.

## [2026-10-11] — The signals card opens by default — the detail is the content (owner round 27)

Twenty-seventh round — the owner, alarmed: the gold-and-silver "What the
signals say" section had lost its information. It had not: since the UX
round-2 density pass (R7b) the card defaults to COLLAPSED and remembers
that choice in localStorage, so every visit opened to a two-line summary
and a small "Show details" toggle nobody connects with five condition
rows, live values and footing rows. "Collapsed" read as "deleted".

### Changed

- **The gold-and-silver card OPENS by default on every visit.** The
  estimation strip, the Supports / Works-against / Neutral condition
  rows (with their live values and one-line "how" explanations), the
  per-metal footing rows and the silver-only condition render
  immediately — no click, no remembered state.
- **The collapse is session-only now.** "Show details / Show fewer"
  keeps working (and pill/hash links that target the section still
  expand it), but the choice is no longer persisted to localStorage —
  a fresh load always shows the full card. The localStorage key
  `currena.insights.signals-open.v1` is retired; existing visitors who
  had it "closed" stop being stuck collapsed (and stale keys simply
  rot in place, unread).
- The collapsed two-line summary keeps its round-24/26 takeaway
  (direction icon + value word) for anyone who does fold the card away.

### Why not just flip the stored default

Remembering "open" would have fixed the owner's browser but kept the
trap: one accidental "Show fewer" and the information is gone again for
that visitor, forever. The card's whole point is the conditions behind
the estimation — they now show up the way the owner expects, every time.

### Housekeeping

- No copy, type or engine changes — verdictOf, the vote engine and both
  locales are untouched; the Insights chunk SHRANK slightly (localStorage
  read/write effects removed): 319.94/82.52 kB raw/gz against the
  round-25 budget 322.50/84.00. No bump.

## [2026-10-11] — The estimations speak in value and cost, not bare directions (owner round 26)

Twenty-sixth round — the owner, pointing at the red-and-green "will go up":
misleading — it needs supportive words that match the ink ("Growing
Positively"-shaped value words for the metals; "Becoming More Expensive"-
shaped cost words for the money rows) and a direction icon everywhere the
estimation appears.

### Changed

- **Metals estimation chips — value words**: "will go up / will go down"
  → "gaining value / losing value" («ارزش می‌گیرد / ارزش می‌بازد»); flat
  and none unchanged. The words now explain the ink: green means the metal
  is worth more, red means it is worth less — a holder-view sentence, not
  a bare futures claim.
- **The collapsed per-metal summary carries the direction icon now** —
  round 24's takeaway line was word + ink only; the same 14px arrow the
  strip uses rides the line (icon + word + ink, never colour alone, G5).
- **Money estimation words — cost words, valence-matched**: the generic
  "Will go up / Will go down" split into two word-sets that follow each
  area's valence: cost areas (petrol, home loan, shop, overseas) say
  "Becoming more expensive / Getting cheaper" («گران‌تر می‌شود /
  ارزان‌تر می‌شود»); savings says "Earning more interest / Earning less"
  («سود بیشتری می‌گیرید / سود کمتری می‌گیرید») — savings-up is the GOOD
  case (green), and "becoming more expensive" in green would have been
  nonsense. The direction word now always agrees with its colour.

### Why the words changed and the engine did not

The round-25 vote engine is untouched — band breaches, big moves and
10-year extremes still decide every arrow; the tally is still a
description of conditions, not advice. Round 26 only changed what the
arrow SAYS. Today's live data still reads every money row "up" — petrol,
home loan and shop prices "Becoming more expensive" in warning red while
savings "Earns more interest" in calm green — and the metals card split:
gold "losing value" (red), silver "no clear direction" (neutral). The
engine still flips by itself when the regime turns; the words now keep
making sense when it does.

### Housekeeping

- The R11 "no will" corpus guard is strict again: the round-25 exemption
  for the estimation keys is gone — the new words carry no "will", so the
  whole money corpus (both locales) is will-free and buy/sell-free as
  before. The type-lock (InsightsCopy = typeof insightsCopyEn) forced the
  fa mirror in the same commit, as designed.
- No bundle-budget movement: the Insights chunk measures 320.14/82.52 kB
  raw/gz against 322.50/84.00 — the words swapped, the arrows were already
  shipped, and the one new icon (collapsed line) fits inside the round-25
  budget without a bump.

## [2026-10-11] — The money rows speak: a stated estimation under every "What it means for my money" item (owner round 25)

Twenty-fifth round — the owner, pointing at the money panel: a very simple,
short estimation under EACH item ("Petrol and transport, will go up, with an
arrow to up — showing that it will be more expensive"), and it must be based
on calculations and data, not decoration. The same language the gold-and-
silver card earned in round 23, now computed from each area's own drivers.

### Added

- **A stated estimation under every money row**: arrow + "Will go up /
  Will go down / No clear direction" («بالا می‌رود / پایین می‌آید /
  جهت روشنی ندارد»), sitting directly under the area name — the exact
  spot the owner sketched. It is a mechanical tally, not a vibe: each
  area's driver readings vote, majority wins, tie or silence → flat.
- **The vote engine** (`config.moneyDriverVote` / `moneyAreaDirection`),
  one vote per driver, first match wins:
  1. a published band breach (CPI above the RBA's 2–3% band) — the
     strongest causal claim the corpus itself makes;
  2. a statistically big move (|moveScore| ≥ 2, the jumping threshold) —
     the change tends to feed through ("pump prices follow within weeks");
  3. a 10-year extreme level (position band high/low).
  Votes pass through per-driver semantics (`MONEY_DRIVER_KIND`):
  `direct` (brent, the cash rate, the paid mortgage rate — the driver IS
  the area's number), `inverse` (FX: a FALLING AUD makes imports and
  travel dearer), `growth` (CPI/rent/petrol yoy — votes up on breach,
  extreme or acceleration but NEVER down: a growth series below its range
  still means costs RISING, just slower — rent growth at its 10-year low
  is not "rents will get cheaper"), `none` (debt arrears, jobs/pay —
  consequences and mixed semantics don't vote).
- **Valence ink, not direction ink**: the metals card colours by direction
  because the owner HOLDS metal (up = good, green). The money panel is the
  household PAYS side: green = good for your money, red = pressure on it —
  "Petrol will go up" warns in alert red while "Savings interest will go
  up" reassures in green (rising interest is the good case; today it is
  the only green row: cash rate at its 10-year high, CPI above the band).
  The arrow always matches the word — never colour alone (G5).

### Why today's panel reads the way it does (all four rows up — the data, not a bug)

Brent sits at the 99th percentile of its decade and jumped +7.2σ in 30 days,
while the AUD fell −5.5σ (imports dearer) → petrol up. Both inflation
gauges print above the RBA's own 2–3% band → shop prices up. The cash rate
and the paid mortgage rate sit at their 10-year extremes (1.00 / 0.95) with
rents still rising 3.6% yoy → home loan up. Savings ride the same two
readings upward → the green row. In a cutting regime the same engine flips
the rows to "will go down" — the arrow follows the data.

### Housekeeping

- Bundle budget bumped 318.5/82.5 → 322.5/84.0 kB (raw/gz) WITH justification
  (Insights 317.60/81.93 → 319.80/82.41: the vote engine, the 16px arrow
  set and 3 copy strings × 2 locales; entry untouched at 290.33/87.06).
- The R11 "no will" guard now exempts the three estimation keys (owner
  override, same precedent as round 23's verdict strip); buy/sell stays
  banned everywhere and the hedged sentences stay "will"-free.
- New guard file `money-direction.test.ts` (20 tests): vote priority,
  growth-silence (no fake "cheaper"), inverse FX sign, tally/tie → flat,
  valence ink matrix, and a live-shaped regression of today's four rows.

## [2026-10-11] — The roast round: meaning on every warning card, a quieter hero, Jalali everywhere, red discipline, and brand gold (owner round 24)

Twenty-fourth round — a full design roast of the Persian build scored the
page B- with a ranked fix list. All seven "fix this first" items shipped.

### Changed

- **Every needs-attention card and hero tile now carries a one-line
  MEANING** (roast #1: "a rule but no meaning"). A new authored corpus —
  30 indicators × 2 locales (`copy.meaning`) — says what the fired rule
  actually means for the reader ("دستمزد از قیمت‌ها عقب مانده است:
  افزایش حقوقِ هر سال، کمتر از سال قبل می‌خرد."), replacing the
  "قاعده: …" jargon on the hero tiles, alert cards and compact rows. The
  technical rule text stays in the details panel. The line sits in a
  SOFTENED tint (`/10 → /[0.07]`, ring `/25 → /20`) — red belongs to
  words, not walls of pink.
- **The hero says it once** (roast #2). Gauge rows now show only the
  non-calm gauges (unreadable rows stay — they are the honest "cannot
  read" signal); the separate "الان نیازمند توجه" kicker is gone (the
  count line above the tiles already says it); and the tail clause can
  no longer lie — the old mode-based "بقیه در وضعیت پایدار هستند" sat
  beside a Cautious gauge row, so when the remaining gauges disagree the
  sentence now enumerates their DISTINCT words ("The rest are Cautious
  and Stable." / «بقیه در وضعیت محتاط و پایدار هستند.»). New
  `heroReasonOthersMixed` + `heroReasonAndWord` keys; the mode fallback
  stays for call sites without the mixed template.
- **Jalali on every card footer in Persian, through the one formatter**
  (roast #3): the alert card hardcoded `'en'` into `formatAsOf` — Latin
  dates on a Persian page. It now derives the locale from
  `numberLocale`; every other card already used the shared formatter.
- **Red discipline** (roast #4): the four money-panel area labels are
  neutral ink (state still shows in the sentence + chips); hero tile
  tints softened; red remains on "needs attention" words, counts and
  card accents only.
- **Price tiles** (roast #5): a missing change renders a quiet em-dash
  instead of two «ناموجود» labels per tile (six empty labels in a strip
  that should be clean), the position word holds its line
  (`whitespace-nowrap`), and each commodity wears a small pictogram —
  droplet, ingots, coins, ₿ — in the money-panel's tinted-box language,
  with the GOLD tile wearing the brand gold.
- **Footer bidi fixed** (roast 🔴): the official English FRED notice now
  sits on its OWN `dir="ltr"` line, with the Persian explanation on the
  next line in the page's direction (`fredLocalNote` key; en renders no
  second line). No more stray colon or ".(" at a line start.
- **Brand gold is the ONE accent** (roast #7): new tokens
  `--color-accent-gold` (#F3B13F fill) / `-ink` (#2A1F04 text on gold) /
  `-deep` (gold-family ink for highlights: #A87E1C light, #E8B54A dark).
  The lane switch and section pills' selected state is now gold with
  dark ink (was blue/white), and the biggest-move card — the page's
  focal moment — carries a gold ring and gold kicker icon.
- **Smaller findings**: gauge rows and their step words bumped
  caption → label size (the roast measured ~11px words), the compact
  meter grew 44 → 52px wide with 6px segments, and the collapsed
  gold-and-silver summary now ends with its takeaway — the round-23
  estimation, in the direction's ink («برآورد: پایین می‌آید») —
  fixing "jargon with no takeaway".

### Housekeeping

- Bundle budget bumped 307.5/79.6 → 318.5/82.5 kB (Insights chunk
  306.68 → 317.60 kB raw / 79.19 → 81.93 gz): the roast's #1 fix is
  content — 30 meaning lines × 2 locales — plus the mixed-rest keys,
  collapsed verdicts and pictograms. Entry untouched at 290.33/87.06.

## [2026-10-11] — The owner's exact Carbon state palette, and an estimation you can point at (owner round 23)

Twenty-third round — the owner pinned the exact state colours ("use the
given colors for states", IBM Carbon's signature hues in chat) and asked
the gold-and-silver card for "an estimation and verdict, for example,
Gold will go up, Silver will go down."

### Changed

- **Status palette = the owner's four hexes, verbatim.** Round 22's retuned
  inks still read dark, so the four state tokens are now the exact colours
  from the owner's palette image in BOTH themes: Green 50 `#24a148`
  (Stable/supports), Yellow 30 `#f1c21b` (Cautious), Orange 40 `#ff832b`
  (Stressed), Red 60 `#da1e28` (Critical/works-against). The words, meter
  segments, status chips and alert-card accents all read from the tokens,
  so the whole ladder (and the attention tints, re-based to
  `rgba(218,30,40,…)`) picks up the new hues at once. One deliberate
  exception, disclosed: in DARK mode the Critical ink takes Carbon's own
  dark-surface sibling Red 50 `#fa4d56` — `#da1e28` verbatim is 3.2:1 on
  the `#1A222E` card (muddy), `#fa4d56` holds 4.8:1; Carbon pairs 60/50
  across themes for exactly this reason. Known trade-off, owner's call
  kept: Yellow 30 on white is ~1.7:1 — legible at the 25.6px/800 verdict
  size, faint at small label sizes; the exact hue ships as instructed.
- **The gold-and-silver card now states its estimation.** A new
  "Estimation" strip opens the merged card with one direction chip per
  metal: a mechanical tally of the conditions listed below (supportive
  minus against; the sign is the direction) → "will go up" in the green
  ink, "will go down" in the red ink, "no clear direction" in neutral,
  "no estimate yet" when nothing reads (the strip hides only when NEITHER
  metal could be read). En + fa copy (برآورد / بالا می‌رود / پایین
  می‌آید / جهت روشنی ندارد), arrow glyphs (icon + word + colour — never
  colour alone), RTL-safe, chips split the row at ≥sm and stack on
  phones. Current data renders exactly the owner's example shape:
  "gold will go down · silver no clear direction". Still a description of
  conditions, not advice.

### Housekeeping

- Bundle budget bumped 305.0/78.9 → 307.5/79.6 kB (Insights chunk
  304.25 → 306.68 kB raw / 78.75 → 79.19 gz): the verdict strip's
  component, arrow icons and 5 new copy strings × 2 locales. Entry
  untouched at 290.33/87.05.

## [2026-10-11] — Fresh traffic-light status hues, no dead white space in card lanes, and a gold-and-silver card that speaks at full size (owner follow-up)

Twenty-second round — owner feedback on the verdict colour scale, the
gold-and-silver card's typography, and a hard rule: "such gaps must never
happen".

### Changed

- **The verdict scale is now a proper traffic light.** The R30 status inks
  read as dark and saturated on light surfaces (near-black green, brown
  amber, burnt orange, maroon). All four retuned to fresh hues in BOTH
  themes, chosen by contrast script so every ink holds ≥4.5:1 on white, on
  `--color-currena-bg-light`, AND on each status chip's own tint:
  Stable/green `#256D29 → #137A39` (dark `#63C06C → #4ADE80`),
  Cautious/yellow `#9C5019 → #9C5D07` (dark `#FBB48C → #FBBF24` — a true
  yellow instead of peach), Stressed/orange `#C2410C → #C94908` (dark
  `#F0A04B → #FB923C`), Critical/red `#B92E2E → #CE2A2A` (dark
  `#FF8080 → #F87171`). The words, the meter segments, the status chips
  and the alert-card accents all share the tokens, so the ladder now reads
  green → yellow → orange → red at a glance; Stressed (orange) and
  Critical (red) are finally distinct hues at the group header too. The
  legacy `currena-*-deep` converter accents are untouched.
- **Gold and silver card: full-size voice + owner colour coding.** The
  card whispered at caption size — the "Supports / Works against" state
  words and every "how" description now speak at the same label size (14 px)
  as the alert cards' titles and consequence lines, and all five group
  headings share one heading style. The I17 "no green/red for
  supportive/against" rule is OVERRIDDEN here by owner instruction (the
  same sanctioned exception as the pattern lines): supportive rows take the
  green status ink, works-against rows the red, neutral/unknown stay stale —
  on the state words, the icons and the three group headings (never colour
  alone; the words stay).
- **Card lanes can no longer leave dead white space.** The owner: "there is
  a strange gap in right of the boxes … such gaps must never happen, either
  by expanding the two cards (if there are only two), or other methods."
  Root cause: `repeat(auto-fill, minmax(300px, 1fr))` reserves every track
  that FITS, not every track that's USED — two attention cards in a
  three-track row left a ~360 px dead column; auto-fit only collapses empty
  tracks and still can't stretch a short LAST row (the lone "Gold's price
  versus silver" row kept a dead half-lane beside it). New `.lane-fill`
  utility (flex-wrap + grow, 300 px basis for cards / 420 px for compact
  rows): every line — including the last — fills edge to edge, two cards
  split the row equally, a lone card takes it whole, and same-line cards
  equalise height (stretch). Applied to the indicator-card lane, both
  compact-row lanes (groups + pinned) and the Together connection lane.
  Verified measured 0 px right-gap on all eight lanes at 1280 px; 375 px
  stacks one per line with zero horizontal scroll.

### Verification

- Gates: typecheck 5/5; tests 784/784; build ✓; budgets held with no bump
  needed (Insights chunk 304.25/305.00 raw, 78.75/78.90 gz — the lane
  classes replaced longer grid utilities). Entry untouched (290.33/296).
- Local QA (wrangler :8787 + vite :4174): hero words + meters read the new
  ramp in fa/en × light/dark; the two-card attention row measures
  539 px + 539 px = full lane; the three-row markets group ends with a
  full-width row; signals card greens/reds verified both locales; console
  and page errors silent. Screenshots in the session uploads.

## [2026-10-11] — Alignment sweep: one grid for headings and numbers, visible icons, a card for the biggest move, and predictions on the pattern line (owner follow-up)

Twenty-first round — four owner directives from annotated screenshots.

### Fixed

- **Price tiles (en + fa): every heading on one line, every number aligned.**
  Two root causes: (1) `<button>` vertically CENTRES short content (UA
  behaviour) — the tile's inner column floated down by (button height −
  content height)/2, so the name/price/change rows started at a different y
  per tile (oil/silver +12 px, bitcoin +1 px, gold 0). The column now fills
  the button (`h-full`), pinning all rows to the top in all four tiles.
  (2) The price was rendered inside `<bdi dir="ltr">`, which flipped the fa
  unit word ("۱۲۵٫۴۴ دلار" → "دلار ۱۲۵٫۴۴") inconsistently per tile; the
  price is now a plain `<bdi>` (auto direction) so the unit lands on the
  same side of the digits everywhere. The 7d/30d row became two cells —
  value slot (reserved width, tabular) then the day label OUTSIDE the ltr
  bdi — so the fa label order finally matches the n/a case and the numbers
  align across tiles. Needs-attention tile names got a fixed two-line slot
  (`line-clamp-2` + `min-h-[2.75em]`) so their big numbers align in a row.
- **Money panel: visible 64×64 icons.** The 16–18 px line icons are now
  40 px strokes inside a 64×64 tinted rounded box (48 px on phones),
  top-aligned rows, fixed 160 px label column; chip values moved to plain
  `<bdi>` (same unit-flip fix).
- **Biggest move has a proper container.** The stray hero line is now a
  card (surface + ring) with a kicker header (TrendingUp icon + title);
  the 30-day label sits OUTSIDE the ltr bdi (no more "نقطه۳۰ روز" squish).
- **The pattern line now predicts.** Under "الگوی همیشگی الان پیداست." /
  "Usual pattern showing right now." every active/partly connection card
  lists one clause per leg: fa «{name} بالا می‌رود» / «پایین می‌آید» /
  «ثابت است» (motion verbs; all leg names are singular) — en stays
  telegraphic "{name} rising / falling / steady" (no verb agreement, the
  phrases-corpus rule). Colour carries DIRECTION here by explicit owner
  instruction — the one sanctioned exception to "colour carries status":
  green `--color-status-normal` rises, red `--color-status-alert` falls,
  neutral for steady/level-only. Disagree/inactive cards stay honest and
  show no prediction. New `together.moves` copy block × 2 locales.

### Verification

- Gates: typecheck 5/5; tests 784/784; build ✓; budget bump
  304.2/78.6 → 305.0/78.9 (documented in the gate script): Insights chunk
  304.44/305.00 raw, 78.76/78.90 gz — the moves corpus (12 strings × 2
  locales) plus the mover card and icon boxes. ENTRY untouched
  (290.33/296).
- Local QA (wrangler :8787 + vite :4174): measured nameY/priceY/change-row
  identical across all four tiles (1101/1126/1162); attention-tile numbers
  aligned in both region cards; money icons 64×64 (48 on mobile); moves
  clauses verified green/red/neutral in both locales; fa price text
  "۱۲۵٫۴۴ دلار آمریکا" one line in every tile; 375 px zero overflow;
  light + dark; console silent. Screenshots in the session uploads.

## [2026-10-11] — Vocabulary: Stable · Cautious · Stressed · Critical (owner wording)

Twentieth round — the owner picked the final verdict ladder. The Task-9
proposal (Low · Moderate · Elevated · Severe) is replaced by the owner's
own four words, which keep the intensity reading and add the familiar
risk-dashboard tone.

### Changed

- **Verdict words (en):** Low → **Stable**, Moderate → **Cautious**,
  Elevated → **Stressed**, Severe → **Critical**. Same plumbing as
  before: display words only — machine keys
  (`relaxed/cautious/stressed/alarmed`), API contract, meter segments
  and colours untouched.
- **Verdict words (fa):** کم → **پایدار**، متوسط → **محتاط**،
  بالا → **پرتنش**، شدید → **بحرانی** — natural inside the existing
  sentence templates ("۱ از ۵ حوزه در وضعیت بحرانی است: قیمت‌ها.
  بقیه در وضعیت پایدار هستند.").
- The About-dictionary entry for the four words (dead key kept for
  type parity) and the FA header wording note were updated to match.
- Test fixture: heroReason word table + inline assertions moved to the
  new words.

### Verification

- Gates: typecheck 5/5; tests 784/784; build ✓; budgets held —
  Insights chunk 302.23/304.20 kB raw, 78.33/78.60 gz.
- Local QA (wrangler :8787 + vite :4174): en + fa hero sentences, region
  cards, gauge words and meter aria ("Global: Stressed, step 3 of 4")
  all carry the new words; light/dark, 375/1280 widths, zero console
  errors, zero horizontal overflow.

## [2026-10-11] — Vocabulary: Low · Moderate · Elevated · Severe, and zero em dashes (owner request)

Nineteenth round — two owner directives: the verdict words
(relaxed/cautious/stressed/alarmed) should be more intuitive ("relaxed is
a bit off in this context"), and every em dash comes out of the copy.

### Changed

- **Verdict words (en):** Relaxed → **Low**, Cautious → **Moderate**,
  Stressed → **Elevated**, Alarmed → **Severe** — the standard
  intensity ladder (the same shape health/weather/risk dashboards use),
  grammatical in every sentence the generator builds ("1 of 5 areas is
  Severe: Prices. The rest are Low."). The machine keys
  (`relaxed/cautious/stressed/alarmed`) and the API contract are
  untouched: only display words changed.
- **Verdict words (fa):** آرام → **کم**، محتاطانه → **متوسط**،
  تحت فشار → **بالا**، نگران‌کننده → **شدید** — written natively into
  the existing sentence templates ("۱ از ۵ حوزه در وضعیت شدید است:
  قیمت‌ها. بقیه در وضعیت کم هستند.").
- **Em dashes retired from ALL user-facing copy:** 717 replacements
  across the four dictionaries (EN insights 324, FA insights 319, main
  EN 40, main FA 34). Mid-sentence "X — Y" became "X: Y" (colon, the
  natural elaboration mark); paired asides became parentheses; the
  missing-value dash became the locale word **n/a / ناموجود** (new
  `ui.na` + `common.na` keys). Numeric ranges keep their en dashes
  (2023–26) and minus signs keep U+2212 — those are typography, not the
  AI-tell dash.
- **Component sites:** price tiles, connection legs, alert rows and
  details ("Rule: … · now n/a"), the sr-only separators (", "), the
  Signals collapsed footing ("; "), the biggest-move line (dash
  dropped, flex gap already separates), currency options ("USD · name"),
  share text ("Currena (currena.ir)"), the calendar export name, the
  LED gold board's missing change % (locale n/a, threaded as a prop),
  RateDeltaChip and the index.html share cards (og/twitter/title).
- **Calendar data:** `data/insights-calendar.json` titles carried
  "ABS consumer price index — September quarter" (etc., 8 strings ×
  en+fa) — now colons; the fix reaches production KV at the next
  snapshot ingest, until then the LIVE page keeps the old data-side
  titles.

### Budgets

- Insights lazy chunk 304.01 → 302.20 kB (78.52 → 78.33 gz) — the copy
  pass shrank strings. Entry 290.33/296, 87.06/89.50 gz. Budgets held.

## [2026-10-11] — Prices tiles: one box size (owner follow-up)

Eighteenth round — the owner's screenshot of the new prices board showed
the four tiles with ragged bottoms (Silver 24px shorter than Gold) and
asked for "containers same width and height".

### Fixed

- **Equal-width, equal-height tiles:** the grid carried `items-start`
  (a left-over of the R10 row design where an open row must not stretch
  its neighbours), so every tile shrank to its own content height.
  Removed — grid stretch plus `h-full` on the tile and its button now
  gives the four containers identical boxes (the button still covers the
  whole tile for the click-to-details affordance). Widths were already
  equal (measured 264.5px ×4 at 1280) — the ragged BOTTOMS were the
  defect.
- **Retired the PB1 table-row CSS:** `.price-row` was the OLD anatomy
  (flex row, 12/16px padding, bottom divider). The R30 rewrite turned the
  class into a card hook but the unlayered rules kept WINNING over the
  card utilities — measured on production: `padding: 12px 16px`
  overriding `p-4`, plus a stray 1px bottom border inside every tile.
  Rules deleted; the class name stays as a stable DOM/test hook.

## [2026-10-11] — Insights roast fixes: colour roles, hero generator, card grid, copy (R30)

Seventeenth round — a third-party roast of the 11 Oct build (English,
desktop, light) graded the page B- with a ranked fix list. Six fixes
shipped; the two flagged "render defects" were reproduced in a real
browser at several widths and shown to be screenshot artifacts (no
`content-visibility` in the codebase; the Signals header and the yen card
render exactly once — the lone card now keeps its siblings' width instead
of stretching full-width, which is what the reviewer read as a duplicate).

### Fixed

- **Hero sentence generator (R30):** the reason line embedded the full
  gauge QUESTION — "1 of 5 areas is Alarmed: Are prices heating up?."
  (the reviewer's "?." punctuation error) — and summarised the tail with
  `Math.max`, claiming "The rest are Cautious" when three of four were
  Relaxed. New `groupShort` corpus (9 gauges × en/fa) feeds short names
  ("Prices"), and the tail word is the MODE of the remaining steps
  (ties resolve up): "1 of 5 areas is Alarmed: Prices. The rest are
  Relaxed."
- **Verdict meter:** the four-step scale now has four DISTINCT hues —
  relaxed green · cautious amber · stressed orange (NEW
  `--color-status-stressed` #C2410C/#F0A04B) · alarmed red; the meter's
  segments mirror the words exactly and the hero meter is visibly larger
  (`.verdict-meter-lg`). The hero gauges render ONE LINE PER GAUGE
  (short name → mini meter → step word) instead of inline chips that
  wrapped differently per region, and both verdict cards stretch to one
  height (no void under Australia).
- **Colour roles defined once:** red = needs attention ONLY. The Unusual
  tier owns amber (`--color-status-watch`): chip, card accent border and
  tint. Price position words ("expensive"/"cheap") are neutral ink again
  — colour carries STATUS, not direction (the roast: red "expensive" made
  gold, silver and oil all read as warnings). Money-panel icons are
  always the neutral context ink; red stays on the needs-attention word.
  Brand-adjacent captions/labels: the ink ramp compresses so EVERY ink
  is ≥ 7:1 (secondary #47525D light/#A9B5C5 dark, tertiary #4F5A66/#A2AEBC
  — captions measured 4.3:1 before).
- **Visible Global | Australia switch:** the lane switch rode below the
  fold; a second instance now sits on the first screen (both share one
  state; Global default per D7).
- **Card grid:** `auto-fill minmax(300px, 1fr)` (was auto-fit 260px) —
  no four-column five-line titles, lone cards keep sibling width, prices
  tiles share ONE anatomy (always-present 7d/30d row with the position
  word INLINE; gold/silver/Bitcoin changes derived client-side from the
  cached 10-year histories — the feed carries them for oil only; missing
  data renders "—"), Bitcoin's ratios collapsed into the one context
  line every tile uses.
- **Copy gaps:** the sentence-versus-number guard DROPS the consequence
  line when a needs-attention card's numbers read "typical" (wage growth
  and unemployment no longer say "sits in its usual range" under a fired
  rule); the Unusual cards no longer show a "Rule zone" no rule fired
  (zone ticks live on needs-attention cards and the details panel);
  "See all 1 indicators" → honest plurals ("Show 1 hidden indicator");
  heavy blue pills became quiet text buttons; money-panel lines name the
  actual driver ("Oil has left its usual range…" — no more templated
  "unusually prominent") with a fixed 176px label column so sentences
  align; footers show PUBLISHERS ONLY (`friendlySource`: "ABS", "RBA",
  "FRED", "GoldAPI") — raw series ids ("CPI_Q Trimmed Mean",
  "RES_DWELL_ST", "RBA F6") left the card faces and tags (they remain in
  the details panel).
- **Type hierarchy:** section headings step up to 19/700 (cards speak at
  14) — the roast: "section headings are the same size as card titles".
  Together chips' state words speak in status ink.

### Deliberately NOT restored

- The roast flags the missing "Before you act" box (R24) as unfinished —
  it was removed on the owner's explicit request earlier this build cycle
  and stays removed.

### Budgets

- Insights lazy chunk 301.21/78.06 → 303.98/78.50 kB gz; budget 302/78 →
  304/78.6 with the itemised justification in
  `scripts/check-bundle-budget.mjs`. Entry untouched (290.32/87.04).

## [2026-10-10] — Insights UI/UX audit: ink ramp, status-ink words, type hierarchy (R29, owner request)

Sixteenth round — the owner reported "everything is written with black
color" and "low typographic hierarchy, every heading is screaming". The
audit (docs/insights/08-uiux-audit-2026-10-10.md) found a REAL bug under
the first symptom, then fixed both.

### Fixed

- **ROOT CAUSE (A0/A1):** Tailwind 4 resolves ambiguous arbitrary values
  `text-[var(--type-label)]` / `text-[var(--type-caption)]` as **colour**
  utilities, not font sizes — `.text-\[var\(--type-caption\)\]
  {color:var(--type-caption)}` is invalid at computed-value time and, since
  it sorts after the colour utilities, it cancelled them and fell back to
  inherited primary ink. Net effect since I15: the type scale never applied
  (everything ~16px) and labels/captions rendered primary-dark — the
  owner's "everything is black". Fixed with explicit length hints,
  `text-[length:var(--type-label)]` / `text-[length:var(--type-caption)]`
  (128 occurrences across 18 files). The intended scale (label 14px,
  caption 12.5px) finally computes.

### Changed

- **Ink ramp (A2):** secondary ink #46505C → **#56616E** (6.3:1 — a step
  the eye can see); NEW tertiary grade **#6B7683** light / **#8291A5** dark
  for captions, timestamps, sources, disclaimers, kickers.
- **Status words speak in status ink (A3):** new `--color-status-watch`
  (#9C5019 light / #FBB48C dark) plus `stepToneClass` /
  `attentionToneClass` / `bandToneClass` helpers. Verdict words
  (Relaxed green · Cautious watch · Stressed/Alarmed red), hero gauge step
  words, "n of m need attention" counts (red while n>0, green when clear),
  and PRICE position words (expensive red · cheap green · typical neutral;
  indicator positions stay neutral per R5) now carry their status colour —
  always beside an icon, meter or number (G5, never colour alone). The
  7-day/30-day deltas stay deliberately neutral (R5/R9).
- **Typographic hierarchy (A4):** 800 weight reserved for numbers. New
  roles: `.type-section` 17px/700 (five section h2s + details-panel title,
  was 18px/800), `.type-question` 15px/600 (group questions, connection
  cards, pinned strip, was 14px/800), `.type-kicker` 11.5px/600 uppercase
  tertiary (GLOBAL/AUSTRALIA, NEEDING ATTENTION NOW, SEARCH/FILTER/
  DOWNLOAD, HISTORY, signals footing labels) with letter-spacing scoped to
  `html:not(:lang(fa))`; page h1 24px 800 → 700.
- Icon sizes from the previous round unchanged (23/17/16/18/22/24 set).

### Verification

- Gates: typecheck 5/5 · tests 784/784 · budgets entry 290.32/296,
  Insights 301.21/302 (length hints +0.9 kB, under the cap).
- Browser: computed styles (tertiary @ 12.48px; "expensive" red @ 12.48/700;
  "Stressed" red @ 25.6/800; kickers 11.52/600); en/fa × light/dark ×
  1280/375 screenshot pass; 375px overflow clean; console silent.

## [2026-10-10] — Insights imagery: lucide-react icon language (owner request)

Fifteenth round — the owner asked for real iconography on the Insights
page. **Lucide** (`lucide-react`, ISC licence — free for commercial use)
chosen: it tree-shakes to per-icon ESM modules, and its 24-grid stroke
style matches the page's existing hand-drawn AreaIcon/StatusChip language
exactly (16px stroke icons, `currentColor`, aria-hidden).

### Added

- Ten named, tree-shaken lucide icons replace thirteen text glyphs:
  `Wrench` (was 🛠 Tools button), `Search` (was 🔍, in the Tools search
  field AND the no-matches empty state — now inside a soft circle),
  `CalendarDays` (was 📅, both .ics buttons), `Download` (was ⬇ CSV),
  `Coins` (new section mark on the prices strip), `Activity` (new section
  mark on "What the signals say"), `ChevronDown` (was ▾/▸ on all three
  disclosures — rotates -90°/90° when closed so it points along the
  reading direction in BOTH LTR and RTL, with
  `motion-reduce:transition-none`), `X` (was ✕ panel close), `Star` (was
  ★/☆ watchlist pin — `fill-current` when pinned), `TriangleAlert` (was
  ⚠️ in the error and from-cache banners).
- The Money-panel rows keep their hand-drawn area icons and the ↗ ↧ ⓘ
  glyphs stay as text: three candidate header marks (Money/Together/
  About) were consciously SKIPPED so the icon set stays at ten and the
  cost small — Money rows already carry icons; Together and About are
  quiet collapsed sections (R25/R7b).

### Changed

- Bundle budget: Insights lazy chunk 300/78 → **302/78** raw kB
  (293.77/74.81 → 300.54/77.51 measured; +6.7 kB raw / +2.7 kB gz for
  the ten icons, itemised in `scripts/check-bundle-budget.mjs`). The
  ENTRY chunk is untouched (290.32/87.05 vs 296/89.5) — every icon lives
  in the lazy Insights route.

### Verification

- typecheck 5/5; tests 784/784; budget green at the documented numbers.
- Browser QA (local Worker seeded from the production snapshot + vite
  dev): en/1280 light — 7 lucide SVGs in the default view, zero emoji
  glyphs left, Tools menu icons verified visually; signals disclosure
  chevron measured `rotate: -90deg` closed → `none` open, card opens;
  fa/375 RTL + dark — chevron measured `rotate: 90deg` when closed
  (points along RTL reading order), Activity mark geometrically at the
  RTL start of the title, no horizontal overflow, zero console errors.

## [2026-10-10] — Insights: remove the "Before you act" box (owner request)

Fourteenth round — a direct owner request to drop the "Before you act"
caution aside (the R24 footer box shipped earlier the same day) entirely.

### Removed

- The footer "Before you act" `<aside id="before-you-act">` from the
  Insights page (en + fa), the "Before you act ↓" pointer button from the
  Signals header, the `jumpBeforeYouAct` scroll/focus/highlight handler,
  and the `beforeYouActTitle` / `beforeYouActPointer` / `beforeYouAct`
  copy keys from both locales. The Signals disclosure, the merged card,
  the collapsed summaries and "About this data" are untouched — the page
  now flows "Next up" → "About this data" → site footer.

### Verification

- typecheck 5/5; tests 784/784 (the removed en/fa four-points parity test
  no longer applies); bundle budget green (entry 290.32/87.06 vs 296/89.5,
  Insights 293.77/74.81 vs 300/78 — the box removal shrank the chunk).
- Browser QA on a local Worker (production snapshot seeded) + vite dev:
  en/1280 and fa/375 — zero console/page errors, no horizontal overflow
  (scrollWidth == clientWidth), `#before-you-act` absent from the DOM,
  no pointer button anywhere, Signals expand/collapse still works, RTL
  and dark/light unaffected. Web-only change (copy + components); the
  snapshot computation is untouched, so no ingest-then-deploy ordering
  applies.

## [2026-10-10] — Insights UX round 2: the signal-first density pass (R1–R28)

Thirteenth round — the owner's second UX spec
(`docs/insights/06-ux-round-2-spec.md`, decisions D1–D13 incl. the
2026-10-10 revision) built end-to-end: a few signals large, the rest quiet,
and every sentence-versus-number contradiction eliminated. Build ledger with
per-block evidence: `docs/insights/ROUND2-LEDGER.md`.

### Added

- **R5 two-tier status model** — `tierOf` pure function: needs-attention
  (a published rule fired; internal id stays `warning`) > unusual (top/bottom
  10% of the indicator's own 10-year range, 30-obs percentile floor) >
  normal; context/stale/unavailable unchanged. The user-facing word "Alert"
  is retired everywhere (chips, filters, counts, hero, CSV); fa gets
  نیازمند توجه / غیرعادی.
- **R11 "What it means for my money" (slim)** — ≤4 lines chosen by the worst
  tier among six life areas (petrol, home loan, savings, shop prices,
  overseas money, jobs), hedged sentences keyed area×state, 1–2 value chips
  linking the cards, calm fallback line. No advice wording, both locales.
- **R15 Tools menu** — one disclosure in the page header holding search,
  status filter, keyboard-shortcuts help, .ics and CSV download; the inline
  FilterBar is deleted and the "Keyboard: / j k" hint line removed; the menu
  closes on Escape/outside click and returns focus; counts describe the
  current lane only.
- **R7b collapsed evidence lanes** — Together and Signals start collapsed
  with a one-line summary each (per-connection chips / per-metal lines),
  Show/Hide disclosures with aria state, localStorage remember (fail-open to
  collapsed), pill/hash/hero links expand via `expandToken`. Signals ships
  the R24 "Before you act ↓" pointer in its header.
- **R24 footer "Before you act"** — rendered exactly once in the footer
  (`id="before-you-act"`, always visible, outside any collapsible); the
  Signals header pointer scrolls + focuses + briefly highlights it
  (reduced-motion aware).
- **R25 quiet "About this data"** — flat section, collapsed by default, with
  the FRED notice, the source credits and the general-information line always
  visible outside the toggle; CSV button moved to Tools; print auto-expand;
  exactly ONE Sources block.
- **R26 merged signals card** — the two near-copy cards become one: the four
  shared conditions listed once, per-metal footing rows, silver-only
  industrial condition separate, neutral "Supports / Works against" icons and
  words (no ✓/✗, no green/red), 30-day speed only when data exists.
- **R27 stat-chip connection cards** — arrows removed; each leg renders as a
  stat chip (name, value WITH unit, state word); the right-now line is one
  truthful clause; the "Evidence: to verify" placeholder never renders (data
  attribute + the section-level quiet note instead); dead `evidenceToVerify`
  copy key deleted.
- **R28 sentence-versus-number guard** — band-quoting lines are computed from
  the rule + live value (`bandPositionOf`/`consequenceLine` with
  `{bandPos}/{bandLabel}` tokens); the R28 known bad pairs (3.4% vs the Fed's
  2% goal, 3.9% vs the RBA 2–3% band) are regression-tested to fail; fa band
  words render natively (درون/بالای/زیر). Fixed a real bug found by the
  guard: a two-sided band value fell through to the one-sided branch and
  read "below" while sitting INSIDE the band.
- **38 round-2 guard tests** (`apps/web/src/components/insights/round2.test.ts`)
  over the pure layer: hero-reason full step matrix + contradiction guard,
  tier precedence/floor/stale, attention-tile ordering, group visibility,
  money-panel selection + advice-word ban, date formats, units coverage,
  code-pattern scan, counts consistency, mergeSignals duplication, evidence
  discipline, band-position math. Suite 747 → **785**.

### Changed

- **R1/R7/R16/R19 page order & defaults** — Global lane first (hero + default,
  swap toggle removed); per-group signals-first collapse ("See all {n}"
  behind needs-attention + unusual + top-up-to-3); Next up moved below the
  indicators; Signals pill added to the sticky band; pills expand their
  collapsed section.
- **R2/R3/R4 hero** — verdicts keep meters with text alternatives
  ("Global: Stressed, step 3 of 4"), gauges, a fixed-table reason line that
  cannot contradict the gauges, up to 3 needs-attention tiles with large
  unit-ful numbers per region, and one biggest-move line that always carries
  its "unusually large for this indicator" reason (the beige callout box is
  gone; stale items hard-excluded).
- **R6 needs-attention face** — every needs-attention card shows
  "Rule: … · now …" on the face; the 10-year position bar shows only on
  unusual cards.
- **R8/R9/R10 anatomy** — consequence lines never truncate; sparklines render
  one neutral tone on Insights (LiveRates untouched); the prices strip is
  four identical tiles (Brent, gold +A$, silver, Bitcoin) with the BTC
  ratios as one small context line — copper and iron-ore move into the
  indicator lanes (`copper-usd` definition group `prices-board` →
  `growth-health`; the R10 "calm is returning" claim is scrubbed from the
  gold lines in both locales and regression-banned).
- **R12/R13/R14/R20 polish** — English dates become month-name form
  ("Oct 10, 2026") with no seconds in "Data as of"; every displayed number
  carries a unit (audusd US$ per A$, home values "index" after verifying the
  ABS series, terms-of-trade "index"); opaque names replaced
  ("Underlying inflation") and source codes audited out; `--type-number`
  raised 1.3rem → 1.45rem so tile/price values compute 1.45× the label role
  (spec floor 1.4×).
- **R21/R22 a11y & Persian parity** — unique "Details: {name}" accessible
  names on every card control; all count interpolations render locale digits
  (fa shows ۲ از ۵, not 2 از 5) including the new collapsed summaries;
  Persian commas in the Together summary; logical properties only in new CSS.
- **R23 budgets** — entry untouched (290.32/87.05 vs 296/89.5); the Insights
  lazy chunk consciously bumps 280/72 → **300/78** (296.12/75.40 measured)
  with the itemised justification in `scripts/check-bundle-budget.mjs`: the
  tier model + money panel + Tools menu + the bilingual corpus growth minus
  the deleted FilterBar.

### Verification

- Gates: `pnpm -r typecheck` 5/5; `pnpm -r test` **785/785**; web build green;
  bundle budgets green.
- Browser QA (agent-browser against the built SPA + wrangler dev seeded with
  the production snapshot): en/fa × 1280×800 / 375×812 × light/dark —
  `scrollWidth == clientWidth` everywhere (the only inner "overflows" are the
  scrollable pill row and the position-bar fill, both by design), zero
  console errors, zero "Alert" words, 4 rule lines on 4 needs-attention
  cards, both evidence lanes collapsed by default with correct summaries,
  the merged signals card with zero ✓/✗, one footer "Before you act" with a
  working pointer, one Sources block, Tools keyboard pass (open, Escape,
  focus return), pill-expand verified, R20 computed ratio 1.45.
- Data note: `copper-usd`'s definition group change is render-time only —
  the snapshot computation is untouched, so this deploy does NOT require an
  ingest-then-deploy ordering.

## [2026-10-10] — I19 the staleness false-alarm fix: govt-interest-revenue's BEA release lag

Twelfth round — the scheduled post-I18 verification pass (per
NEXT_SESSION_PROMPT §4) found the live snapshot carrying **one stale
reading**: `govt-interest-revenue` (US federal interest paid ÷ receipts),
`asOf 2026-04-01`, aged 192 days — one day past the 190-day quarterly
grace (`GRACE_DAYS.quarterly`).

Verification showed the data is NOT late: FRED itself still lists the
**2026-04-01 (Q2) observation as the latest that exists** for both
`A091RC1Q027SBEA` and `W006RC1Q027SBEA` — BEA publishes the Q2 obs with
the advance estimate (~Jul 30) and it stays latest until the Q3 advance
(~Oct 29-30) adds the Jul-1 obs. The 190-day quarterly grace assumed
quarter data arrives faster than BEA's release calendar actually delivers,
so every October this series would honestly-but-falsely read `stale` —
the same obs-date-vs-release-date reality the I15 wave fixed for the ABS
quarter-start items (215d) and Brent (12d).

### Fixed

- **`packages/insights/src/definitions.ts`** — `govt-interest-revenue`
  gets `staleAfterDays: 215` (BEA NIPA obs date from Q-01; ages up to
  ~212d between advances; 215 mirrors the ABS quarter-start discipline).
  The reading returns to `normal` (the value and 10-year percentile are
  unchanged) once a re-ingest recomputes the snapshot.
- **`packages/insights/src/definitions.test.ts`** — the I15
  freshness-overrides test asserts the new override verbatim alongside
  the other obs-date-reality adjustments.

### Verified

- Gates at HEAD: typecheck 5/5, tests **747/747** (core 183 · scraper 67 ·
  insights 193 · api 119 · web 185 — the new assertion lives inside the
  existing I15 overrides test).
- Web build + budget: entry 290.12/86.99 vs 296/89.5; Insights chunk
  270.02/69.50 vs 280/72 — held without a bump.
- Production health + 41 readings before the fix; scheduled ingest runs
  green (run 7 Oct-8, run 12 Oct-9; the failed run 11 dispatch was the
  known KV daily-write-cap 429/10048 — auto-recovered, no data impact);
  daily accrual points present for Oct-8 AND Oct-9 (btc bootstrapped 2
  points, copper/gold/silver carrying their monthly base + daily rows) —
  the 2026-10-15 seven-day-change milestone stays on track.

## [2026-10-08] — I18 the mobile answer-line fix: 375px horizontal scroll removed

Eleventh round — a wrap-up audit of the live I17 deploy caught one real
defect the I17 QA pass had missed: on the Insights page at 375px (and
every width where the L2 header row runs out of room, 320–414px), the
whole document gained ~37px of scrollable horizontal overflow. The
page could be swiped sideways into blank space.

Root cause (found by bisecting the live DOM): the group-header answer
line in `routes/Insights.tsx` was `<span className="min-w-0 flex-1">`.
`min-w-0` lets the flex item shrink *below the min-content width of its
own text* — on a 343px content column the verdict meter (120px) + step
word + count text left the answer only ~38px, and its longest word
(81–90px at caption size) bled out as *scrollable* overflow that
propagated through every `overflow: visible` ancestor up to
`<html>`. The measured chain matched exactly: span overflow 43/53px →
section 386/396 → route container 412 → 37px of page scroll. (RTL/fa
never showed it because right-to-left overflow at the left edge does
not extend `scrollWidth` — which is also why the I17 QA, run in fa
first, could honestly record "no overflow" and miss the en/LTR case.)

### Fixed

- **`apps/web/src/routes/Insights.tsx`** — dropped `min-w-0` from the
  answer span. With the default `min-width: auto` the flex item keeps
  its longest word as its floor, so `flex-wrap` moves the answer to
  its own full-width line on narrow phones (readable, no squeeze) and
  keeps it inline on desktop exactly as before. Desktop layout is
  unchanged (the row has ≥ 81px spare there). Verified live by
  toggling the class off in the production DOM: `scrollWidth`
  412 → 375, horizontal scrollability 37px → 0.

### Verified

- Web typecheck clean; web tests 185/185 (total 747/747 unchanged —
  no behavioural test touched; the change is one utility class).
- Production re-check after deploy: en/375 `scrollWidth = clientWidth`
  (0 scrollable), fa/375 clean, all other routes (`/`, `/history`,
  `/calculator`, `/receipt`, `/settle`, `/about`) 375/375, zero
  console/page errors, the v2 sections (Together + signals) untouched.
- Other `min-w-0` usages audited: CompactRow truncates (clips, safe);
  AlertCard / DetailsPanel / NextUpStrip sit in ≥260px boxes where the
  longest word fits; none of them measured as overflow sources.

## [2026-10-08] — I17 the v2 wave: "Together" connection cards + "What the signals say"

Tenth round — the owner granted full approval ("nothing from spec must
remain"), so the two deliberately-deferred spec surfaces ship now: **T1**
(the "Together" connection cards, UI spec Part 6 v2) and **S1–S3** (the
"What the signals say" cards, v2-gated — the wording-review gate is
satisfied by the owner's approval; the `SIGNALS_ENABLED` flag the spec
mandates exists in `config.ts` and ships **true**, one flip from off).

Everything computes from the snapshot the page already holds — no ingest
change, no snapshot-format change, so the Worker read-side contract and the
ingest-then-deploy order rule are untouched (a plain Worker deploy
suffices; a dispatch still ran as smoke).

### Added

- **`packages/insights/src/connections.ts`** — the six T1 connections in
  spec order (real-yields/gold see-saw, dollar/gold/oil, oil → expectations
  → 10y costs, copper-gold/China-PMI/M2, iron-ore/terms-of-trade/AUD,
  RBA-rate/home-loan/household-debt). Each leg gets a direction (per-leg
  change30d thresholds in the definition's own units) + a level (the F3
  position bands), and a uniform state rule over polarity-adjusted leans:
  `active` (every leg in the relation's configuration) · `partly` (some
  lean, none oppose) · `inactive` (too quiet) · `disagree` (leans point
  both ways — the live see-saw: real yields 99.8th pct AND gold 92.5th pct)
  · `unknown` (a stale/absent leg — the ST2 honesty discipline). Inverse
  connections carry a `polarity: 'inverse'` marker (the first leg vs the
  rest) so the see-saw reading is correct in both directions.
- **`packages/insights/src/signals.ts`** — the S1/S2 card logic: five gold
  conditions (real yields, 5y5y expectations, stress STLFSI+NFCI, the
  dollar basket, the metal's own footing: position + 30-day speed with the
  honest position fallback while the daily history accrues), silver's sixth
  industrial-demand condition (China PMI + copper-to-gold, always tagged
  "mixed"), the lean (`≥4 supportive → mostly supportive`, `≥4 against →
  mostly unsupportive`, else `mixed` — the count line reads "n of m
  conditions met"), and the three plain checks. Live at ship time: gold
  2/5 mixed, silver 3/6 mixed.
- **Web: `Together` + `ConnectionCard`** — the section below the prices
  board: state chip (SVG icon + word, neutral inks — pattern presence is
  information, never advice), leg chips with live values that open the
  details panel (44px targets, focus discipline inherited), relation
  arrows that mirror in RTL (one CSS flip rule), the plain relation
  sentence, the computed right-now line, and the spec-mandated "evidence:
  to verify" tag on every card (the owner confirms evidence per card —
  none confirmed yet, so no card claims reliable/mixed/weak).
- **Web: `Signals` + SignalsCard (S1–S3)** — the "What the signals say"
  section below Together (scroll region under the Together pill): lean
  chip + count line, the three plain checks (10-year position, usual
  drivers, 30-day speed with the honest "Measuring" line), the checklist
  grouped into the two sides ("Usually supports {metal}" / "Usually works
  against {metal}" / a muted neutral tail), and the fixed **before you
  act** box (S3) always visible, never behind a click. No green for
  supportive, no red for unsupportive — icons + words, per the S1 note.
  The S3 dealing-costs point uses inflected forms ("buying", "selling",
  "buyers") so the acceptance-test regex `\b(buy|sell)\b` still passes
  while keeping the spec's mandated meaning; the Persian copy avoids bare
  «خرید/فروش» the same way.
- **Copy: bilingual corpus for both sections** — six connections × (name +
  relation + 5 state lines + leg labels) and both signals cards (6
  conditions + the before-you-act box + the checks) in EN + native FA
  (nav pill «ارتباط‌ها»; telegraphic leg phrases — `{name}: {level} and
  {direction}` — so no verb agreement can break across languages).
- **`SIGNALS_ENABLED`** in `config.ts` — the spec's feature flag, shipped
  `true` with the I17 approval note; `false` hides the whole section.

### Changed

- The sticky section nav (P1) gains the **Together** pill — five sections
  now (Status · Prices · Together · Indicators · About), the spec's v2
  list completed.
- Insights lazy-chunk budget 240/64 → **280/72 kB** (measured 270.01/69.50):
  the v2 corpus + components + the connections/signals logic joining the
  lazy route. Entry chunk untouched (290.12/87.76 vs 296/89.5). The bump
  is itemised in `scripts/check-bundle-budget.mjs`.

### Verified

- Gates: typecheck 5/5 · tests **747/747** (core 183 · scraper 67 ·
  insights 193 = 168+25 · api 119 · web 185 = 174+11) · budgets held.
- The shipped live states are pinned in tests (the 2026-10-08 snapshot:
  disagree/disagree/active/active/partly/disagree; gold 2/5 mixed, silver
  3/6 mixed).
- Browser QA (agent-browser + VLM, en/fa × 1280/375): both sections render,
  leg chips open the details panel with focus trapped, Escape closes, the
  Together pill scrolls, arrows mirror in RTL, zero console/page errors,
  no buy/sell wording (EN regex + FA pattern), no horizontal overflow.
- Production: Worker deployed from the I17 HEAD, dispatch smoke green,
  `/api/insights` unchanged (41 readings), the two new sections verified
  on https://currena.ir (see docs/DEPLOY.md §I17).

### Compliance notes for the owner (standing)

- The signals cards describe conditions and leave every decision to the
  reader; the before-you-act box is fixed copy per the spec. The S3 note's
  "qualified Australian financial-services review before launch" remains a
  standing owner-side item — the wording shipped is the spec's own.
- Evidence tags stay "to verify" until the owner confirms each
  connection's evidence (spec T1 note) — no tag claims reliability today.
- Reminder: rotate the GitHub + Cloudflare tokens that transited chat.

## [2026-10-08] — I16 the daily-accumulation fix: same-day live refresh + the btc bootstrap

Ninth round — a post-I15 production verification pass (the NEXT_SESSION_PROMPT
mission: ingest green ✅, 41 readings ✅, backtest re-run ✅) found the I15
accumulated-daily mechanism broken in two ways, both now fixed at the root:

- **Cross-card price inconsistency (live in production):** the seeded price
  rows kept the FIRST-of-day price while the unseeded gold-silver ratio
  carried the LIVE one — same-date cards disagreed (gold 4136.20 ÷ silver
  60.17 = 68.74 on the board vs a 69.97 ratio reading, both stamped
  2026-10-08). Root cause: `withLivePoint` refused ANY same-date live point,
  conflating "lagging live source" (history strictly newer — keep history,
  correct) with "same day, earlier run" (this run's fetch is the day's
  FRESHEST observation — must replace). Same-date points are now replaced,
  so every card stamped a date agrees on one price set.
- **The btc-usd accumulation could never start:** `buildHistoryFile`
  refused single-point series, so a row with no monthly base (btc has none
  by design) never persisted its first daily point — every run rebuilt a
  single live point, the seed stayed empty forever, and the data spec §3's
  "7/30-day changes from your own stored daily snapshots" would never
  appear on the Bitcoin row. New `minPoints` option (default 2 — the
  live-point cards gold-btc/silver-btc/gold-aud keep their honest no-key
  404); the ingest passes 1 for the accumulated-daily rows so the first
  point IS the bootstrap.
- **gold-silver now rides the accumulation too** (SEED_IDS gains it —
  derived.ts already merged its seedHistory; the ingest's read list was the
  missing half).

Verified end to end with a 3-run/2-day simulation against
`InMemoryInsightsStore` (the ingest write-loop semantics verbatim): day-1
bootstrap writes btc's 1-point key, the same-day re-run replaces the moved
prices and the board/ratio agree exactly, day 8 shows btc change7d = +1.84%.
A worker deploy is NOT needed — the fixes live in the ingest runner
(`@currena/insights/adapters`), which only GitHub Actions executes; the
Worker/SPA import only definitions/gauges/store types. Tests 708 → **711
green** (+3: same-day replace ×2, minPoints bootstrap).

Also noted: GitHub Actions schedules the 04:20 UTC cron ~7 h late (the
runs execute ~11:10–11:30 UTC) — still inside the fresh write-budget window
(the counter crosses 1,000 around 18:30–19:00 UTC), so no action beyond
documentation. `docs/insights/BACKTEST.md` regenerated at this round: the
I15 freshness fix visible in the diff (us-cpi-yoy `stale` → `warning`).

## [2026-10-08] — I15 the owner-spec wave: question gauges, the prices board, and the details panel

Eighth round — the uploaded 2026-10-08 owner specs (`01-insights-ui-ux-instructions.md`
+ `02-insights-data-api-spec.md` + `dollar_basket.py`) implemented end to end:
the data/API spec's new indicators, the Currena dollar basket, per-series
freshness limits and question gauges; the UI spec's v1 blocks (hero verdict
meters, prices board, indicator lanes, compact rows + alert cards, the
side-panel/bottom-sheet details, states, notices). The v2/v2-gated blocks
(T1 connection cards, S1–S3 signals) deliberately NOT built — the spec says
wait. Leftover backlog closed first: #38 Settle multi-tab storage sync +
#29 web-test remainder (rate-history/recent-pairs/display/parity).
Tests 634 → **708 green** (core 183 · scraper 67 · insights 165 · api 119 ·
web 174).

### Added

- **New indicators (11)** — `fed-target` (FRED DFEDTARL/U midpoint, shown as
  the 25bp corridor "3.50–3.75%"), `ecb-dfr` (ECB Data Portal DFR), `us-cpi-yoy`
  (CPIAUCSL 12-month change), `nfci` (Chicago Fed NFCI), `dollar-basket`
  (the Currena dollar basket — `dollar_basket.py`'s recipe ported to
  `src/basket.ts`: DXY weights, 50.14348112 scaling, selftest transplanted),
  `eur-usd`, `au-home-loan` (RBA F6 FLRHOOTA by Series ID — the stable
  identifier; venue-verified 6.21%), `au-wage-growth` (ABS WPI + the new
  **below-aux rule** comparing wage growth with CPI), `au-rent-yoy` +
  `au-petrol-yoy` (ABS monthly CPI Rents/Automotive-fuel — series identified
  by data signature + published-figure cross-checks), `btc-usd` +
  `copper-usd` (gold-api BTC/HG live prices; HG converted to USD/mt to join
  the World Bank history). **`dollar-broad` retired** (DTWEXBGS lags ~5d
  upstream; the basket replaces it). TGJU retired from Insights (unverified
  licence) — gold now from gold-api XAU like silver; the TGJU cross-check
  row retired with it (Bitstamp remains the BTC check).
- **Question gauges** (`src/gauges.ts`) — the spec §4 regime: each lane
  group IS a gauge (share of members in alert → steps 1–4), a region's
  verdict = rounded average of gauge steps escalated when any gauge sits at
  step 4; `summarizeByGauges` writes the same wire shape the old flat-share
  summary did, so /admin and the CSV export agree with the hero by
  construction. 16 global + 13 Australian voting members, exactly the
  spec's v1 lists.
- **Per-series freshness limits** (`staleAfterDays` on definitions, data
  spec §3) — Brent 12 (the EIA weekly-batch false alarm, fixed at the
  root), NFCI 14, ECB 7, Fed 5, basket/EUR 4, metals/BTC/copper 2, F6 70.
  Spec numbers that assumed RELEASE-date aging were adjusted to the
  engine's OBS-date aging with documented reasons (us-cpi 75, ABS monthly
  95, WPI 200, ABS quarter-start items 215 — the latent Oct-8→28 window
  the 190d quarterly grace false-alarms in).
- **moveScore (Block H3)** — the big-mover z-score at ingest ((latest
  change − mean)/std over the 10y window; 30d basis for dailies, 1-period
  for slower series; ≥30-change floor; stale items never carry it) + the
  ONE hero callout replacing the "biggest 30-day changes" list.
- **I15 UI blocks** — `HeroBlock`/`VerdictMeter` (H1: four-step segmented
  meters + verdict word + plain sentence + "n of m in alert" + alert-chips
  by name H2 + the Australia-first order with the swap setting),
  `NextUpStrip` (H6: next-3 events + full calendar grouped by month with
  merged duplicate titles + Gregorian hover), `PricesBoard` (PB1–3: six
  price rows with units, position words, as-of dates, gold's USD+AUD line,
  the Bitcoin context ratios), `LaneSwitch` (L1: remembered
  Global|Australia, thumb-reachable sticky bar on phones), `AlertCard`
  (F1: accent border + tint, sparkline) + `CompactRow` (F2), `DetailsPanel`
  (F5: side sheet on wide screens, bottom sheet on phones, focus trap +
  Escape + focus return + scroll lock + deep links), the sticky section
  nav (P1: Status/Prices/Indicators/About with scroll-spy), SVG status
  icons (G5), the position-word bar with end labels + alert-zone tick
  (G9/F3), design tokens + four type roles + 7:1 secondary ink (G2/G3/G4),
  the FRED® notice + attribution lines (N1), ONE disclaimer line (N2), and
  `Data as of {date}` with the daily-snapshot tooltip (H4).
- **Consequence lines (F4 + data spec §6)** — state-keyed
  (`highRising/highEasing/typical/low/jumping`) plain-language lines with
  hedged wording, stated positions, ≤15 words: 39 indicators × 2 languages
  in the copy corpus; `consequenceLine()` picks by position band + 30-day
  direction with oneLiner fallback.
- **Backlog closes** — #38 Settle multi-tab `storage` sync
  (lib/settle-storage.ts, the alerts-store pattern; +9 tests) and #29's
  remainder (rate-history +17, recent-pairs +9, display/parity +6).

### Changed

- **Groups are questions now** (I15 restructure): borrowing-costs,
  prices-heat, market-stress, dollar-strength, growth-health,
  prices-board (not a gauge), au-inflation-rates, au-households,
  au-trade-currency — replacing the asset-class groups; brent/gold/silver/
  copper/btc/gold-btc/silver-btc live on the prices board (Brent keeps its
  25%/13w rule for its own row but is not a gauge member), iron-ore stays
  a trade-gauge member AND rides the prices board.
- **Copy corpus rewrite** — plain names first (F6: "What the US government
  pays to borrow for 10 years"), technical tags as small `ticker` labels
  (G8, isolated dir="ltr"), the old five-section detail panel reordered
  life-effects-first (F5), status word Warning→Alert (en) / هشدار (fa,
  kept), and every ui string for the new sections — en source of truth,
  fa native + shape-checked (1044 ZWNJ, Persian digits, no buy/sell
  wording per acceptance test 6 — the disclaimer reworded to match).
- **Ingest seeds accumulated daily history** for the live-priced rows
  (gold/silver/btc/copper) from the stored KV histories so 7/30-day
  changes are measurable (data spec §3 note); first runs degrade honestly
  (no changes until history accrues).
- **RBA parsing by Series ID** (parseRbaTableCsv seriesId option) — F6's
  FLRHOOTA matched the way external parsers do it; the title-match path
  stays for F1.1/F2/E2.

### Fixed

- **The Brent false-alarm** (production showed it stale at 2026-09-29 with
  data 8 days old): the 12-day freshness limit replaces the 3-day daily
  grace — EIA publishes daily Brent in weekly batches, "as of {date}" says
  so on the row (PB3).
- The ABSENT FRED notice (spec Block N1: "Check that the notice is present
  today. The screenshot shows no such notice") — now prominent in
  About-the-data with the terms link.
- Chart tick labels raised to caption size (F5) and the SR data table with
  them; the tooltip renders at the caption role too (G3: no visible text
  below the caption).

### Budget

- **Insights lazy chunk 133.85/38.88 → 235.80/61.92, budget 134/39 →
  240/64** — the bilingual corpus doubled (41 indicators × plain names +
  detail fields + state-keyed consequence lines × 2 languages), the
  side-panel/bottom-sheet architecture, the prices board + meters + lane
  switch, and the GAUGES table joining the chunk. ENTRY chunk untouched
  (290.12/87.76 vs 296/89.5) — the money page is protected. Justified
  above; the gate stays enforced in CI.

## [2026-10-08] — I14 rate-alerts wave

Seventh round of the day — the sandbox was RESET between rounds (the whole
`/home/z/currena` working copy wiped; re-cloned at `a6df82c` with a fresh
owner token, remote scrubbed). A full production QA matrix ran FIRST
against the live I13 Worker `69550e36` (entry asset byte-matched the last
recorded build): 30 insight cards, conversion 100 USD → 26,320,000 IRR,
CSV/ics/filter/shortcuts/deep-link all verified en/fa × desktop/375 ×
light/dark, zero console errors, zero overflow — one VLM contrast flag on
the converter's «از/به» labels REFUTED by measurement (6.1:1 AA). This
wave then ships the strongest remaining user-facing feature from the
I13 hand-off: **rate alerts**.

- **`@currena/core` alerts module** — the persisted alert shape (pair,
  direction, threshold, one-way `triggeredAt`/`triggeredRate` stamps),
  strict `parseRateAlerts` (unknown entries dropped, cap 20 — recent-pairs
  fail-open discipline), and the pure `crossesAlert` test: inclusive at the
  boundary (">= 280,000" fires AT 280,000), never re-fires once stamped.
  Platform-free like settle/split; +11 core tests.
- **Web alerts store** (`lib/alerts.ts`) — the browser side in
  snapshot-store's external-store shape (`useSyncExternalStore`): every
  surface (section row badge, dialog list, evaluation engine) reads ONE
  live state; `currena:rate-alerts` + `currena:rate-alerts-seen` in
  localStorage; **cross-tab `storage`-event sync** (the pattern BACKLOG #38
  wants for Settle, proven here first); +12 web tests including the
  storage-event suite.
- **App-wide evaluation** (`useAlertEvaluation`) — mounted in the App
  shell so alerts are checked on EVERY route, not just the converter:
  each snapshot-store emission (boot hydration, fresh fetch, degraded
  rung) re-evaluates every waiting alert through the same
  `liveRateView` honesty gate (unresolvable pairs never false-fire).
  Crossings stamp + persist (reload keeps the ✅ state, no re-fire —
  verified live) and feed a 6s toast (pair + threshold, "+N more" tail).
- **Converter section row + `A` shortcut** — the one-tap door between the
  converter card and the pair chips: 🔔 title, live waiting/triggered
  counts (Persian digits in fa), an unseen-triggered badge with the
  one-way seenAt stamp (a reload never re-nags), and the `A` kbd pill
  (desktop-only, the same guard family as Insights' / J K — typing,
  modifiers and open dialogs all opt out).
- **AlertsDialog (lazy chunk, 7.00 kB / 2.59 kB gz)** — create + review +
  delete in one overlay (ResultPopup a11y pattern: role=dialog,
  aria-modal, Escape, backdrop click, initial focus). The create form
  pre-fills the converter's current pair, mirrors the current live rate
  under the target input, parses Persian digits + thousands separators
  (AmountInput's parser), and an above/below segmented control (radiogroup).
  List rows are honest per alert: ⏳ waiting (with the live rate) or
  ✅ triggered (rate + relative time). The footer says what alerts ARE:
  "Checked while Currena is open — no background notifications" (fa:
  «هشدارها فقط زمانی بررسی می‌شوند که کورنا باز باشد»).
- **26 new copy strings × en/fa** (native Farsi, «نرخ هدف», «بالاتر برود
  از», «فعال شد در ۲۶۳٬۲۰۰», «۱ دقیقه پیش» …).
- **Contrast fixes found by measurement during QA** — the first selected-
  radio styling (white on `currena-blue`) measured **2.35:1** dark and the
  first badge pill (white on `currena-warning`) 2.78:1; both now follow the
  I6-audited pattern (tinted surface + `-deep` ink token, dark badge
  `#1A222E` on `#FF8080`): re-measured **8.94:1** and **6.59:1**. VLM
  PASS ×2 (fa 375 dark dialog + section row); converter + insights
  regressions green, zero console errors, zero 375px overflow.
- **Bundle budget: held WITHOUT a bump** — the dialog is a lazy chunk, so
  the entry actually DROPPED to 290.12 kB / 87.00 gz (I13: 295.11/88.55,
  budgets 296/89.5); Insights untouched 133.85/38.88 (budgets 134/39).
  Tests **611 → 634 green** (core 183 · scraper 67 · insights 132 ·
  api 119 · web 133).

## [2026-10-08] — I13 data-portability & power-reader wave

Sixth round of the day — and the deploy round: the owner pushed the
**26-commit stack** (I7 share/print/chart/CI/alerting + I8 findability +
I9 zoom + I10 personal + I11 live-rate + I12 resilience, `2803932..7467853`)
and the Worker went out at version `dbccaed3` — production smoke green
(health ok, 30 readings, frankfurter cache age 523 s reports **fresh:
true**, the incident window is closed at the root). Post-deploy QA walked
every I7–I12 feature live in the full matrix (fa/en × desktop/375 ×
light/dark): share deep-links open+scroll+focus, chart tooltip + keyboard
stepping, zoom ranges, watchlist pins, reading progress, LiveRateLine
always-on rate, popular/recent pairs, VLM PASS ×2, zero console errors,
zero 375px overflow. This wave then adds the Insights power-reader set:
the snapshot **CSV export** (data portability — localized headers over
ASCII machine-readable values, OWASP formula-injection guard), **j/k
keyboard card-walking** (Gmail muscle memory, pairs with I9's "/" search,
respects the active filter), the **remembered chart zoom** (a chosen
10y/5y/1y range persists across visits — plottability still rules per
series), and a **shortcut legend** in the filter bar (kbd pills,
desktop-only). Plus two BACKLOG hygiene closes: #30 `splitEvenly` →
core (typed `SplitError`, exact-sum largest-remainder, +7 tests) and
#32 parser hardening (batch line/char bounds with typed `BatchError` +
localized toasts; calc accepts NBSP/CR/LF whitespace + unary plus;
typed `too_deep` guard replaces the bare native RangeError on
pathological nesting). Tests 585 → **611 green** (+15 core, +11 web).
Insights chunk 128.42 → 133.82 kB raw / 38.87 kB gz — budget consciously
bumped 132 → 134 kB (gzip still under 39; the growth is the export's
localized column wording, not logic). Entry chunk untouched at
295.11/88.55.

### Added
- **Insights snapshot CSV export** (`apps/web` insights-csv.ts +
  AboutTheData): "Download the data (CSV)" — 12 stable columns (id,
  indicator, ticker, value, unit, status, 7d/30d change, 10-year
  position, as-of, snapshot time, source) in snapshot order; values are
  plain ASCII numbers (period decimal, no separators — parses as numbers
  in ANY spreadsheet locale) while headers/status words localize (en/fa);
  name/ticker/source columns carry the OWASP formula-injection guard
  (same `csvNeutralizeFormula` as the batch export); RFC 4180 CRLF;
  filename `currena-insights-YYYY-MM-DD.csv` stamped from the snapshot.
  8 unit tests.
- **j/k card navigation** (Insights route): `j` opens+scrolls to the next
  visible card, `k` the previous — anchor is the last walked card, else
  the topmost card in view; respects the active filter; same
  typing/modifier guards as "/"; desktop keeps multi-open while walking.
- **Remembered chart zoom** (HistoryChart + chart-range.ts): the chosen
  10y/5y/1y persists in localStorage (`currena:insights:chart-range`),
  every chart opens there on the next visit; strict parsing falls back
  to 10y; storage failures fail OPEN (default, never an error); 5 tests.
- **Shortcut legend** (FilterBar): `/ search · J next card · K previous`
  as kbd pills — desktop-only (`hidden md:flex`), hidden on paper.

### Changed (BACKLOG #30, #32 — hygiene closes)
- `splitEvenly` moved from the Splitter route into `@currena/core`
  (split.ts) with typed `SplitError` (invalid_people / invalid_decimals /
  invalid_total) and input validation; the exact-sum largest-remainder
  arithmetic is unchanged. +7 tests incl. float-noise (0.1+0.2 style)
  and remainder-distribution cases.
- `parseBatchLines` now enforces input bounds — ≤500 non-blank lines and
  ≤500 chars/line — throwing typed `BatchError` codes the BatchConverter
  catches into one localized toast (fa/en copy added) instead of an
  unhandled throw or a per-line wall. +3 tests.
- `evaluateExpression` hardening: NBSP (U+00A0) and CR/LF are skipped as
  whitespace (HTML-copy/multi-line paste reality); unary plus accepted
  (`2*+3`, legacy-eval parity); nesting beyond 128 parens throws typed
  `CalcError('too_deep')` instead of the bare native RangeError. +4 tests.

## [2026-10-08] — I12 freshness & resilience wave

Fifth round of the day. Production QA re-measured the 2026-10-07 incident
LIVE and got the exact shape: with the I6 Worker still deployed (fix
pending), `/api/convert` for international pairs (frankfurter) hard-500'd
from 20:35:30 to 20:46:03 UTC — the cache TTL (5 min) expires 5 min into
each 15-min cron refresh cycle, so **~10.5 minutes of every 15 (70% of
all minutes)** every fetch-context request hit the stale path, tried the
single-flight lock, and (KV writes failing from fetch context) 500'd.
The incident's own fix (I11's ladder degradation) turns those 500s into
"Using cached rates" 200s once deployed — this wave closes the windows
at the ROOT: frankfurter's fresh window is now 15 min, aligned with the
quarter-hour cron, so fetch-context requests stay on the fresh-cache
rung between ticks regardless of KV health. And the SPA stops leaving
first-time visitors dead during any outage window: the snapshot store
grew a self-healing retry ladder and the converter's failure card became
honest (server-vs-network copy), actionable (Try again), and alive
(live countdown + automatic completion when the outage passes). Tests
575 → **585 green** (+2 api frankfurter-window, +8 web — the FIRST
snapshot-store unit tests). Production still serves the I6 Worker
`954f0034` (deploy pending, owner credentials).

### Fixed (incident root-cause mitigation)
- **Per-source fresh windows** (`@currena/core`): `FRESH_TTL_SEC` (one
  global 300 s) is now `FRESH_TTL_SEC_BY_SOURCE` + `freshTtlSec(source)`
  — tgju keeps the 5-min open-market window; **frankfurter gets 15 min**,
  matching the quarter-hour cron refresh cadence (ECB reference data
  updates ~once per business day; a 12-min-old snapshot is MORE than
  fresh). Server (rates-service freshness gate + status fresh flag +
  admin display) and client (snapshot-store staleness) share the same
  per-source semantics, so the client also stops re-fetching frankfurter
  every 5 min. Zero extra KV writes, zero extra scrapes — the stale
  window between cron ticks simply ceases to exist for frankfurter.
  +2 api tests (12-min ECB snapshot → fresh-cache rung with zero
  network; 16-min → honest stale ladder).
- **Failure-card copy honesty** (converter): the API ANSWERING with an
  error (500/5xx envelope — the incident's exact user experience) now
  says "The rate service is temporarily unavailable / Retrying
  automatically" instead of implying the USER's connection is broken
  ("check your connection" while their network is fine was misleading).
  Network-layer failures and offline keep the connection-flavored copy.

### Added
- **Self-healing retry ladder** (snapshot-store): a source that settles
  in the error state (nothing to serve — a first visit during an outage
  window) schedules automatic retries with capped backoff
  **15 s → 30 s → 60 s (60 s cap)**; any success clears the schedule and
  resets the ladder; offline settles never schedule (the online event
  refreshes directly); degraded mode (last-good still serving)
  intentionally does NOT poll — existing triggers cover it. Steady-state
  cost while an outage persists: one request per source per minute, the
  same order as the LiveRates poll. `nextRetryAt` (immutable epoch-ms
  stamp) exposes the schedule to the UI.
- **Failure card redesign** (converter, money page): role=alert card
  with the warning icon in a tinted circle, kind-aware honest copy
  (above), a localized **Try again** button that re-runs the conversion,
  a **live countdown** («Retrying in 14s» / «تلاش مجدد تا ۱۴ ثانیه دیگر»,
  Persian digits in fa, self-ticking every second, aria-live) while the
  store self-heals, and **automatic completion**: when the failing
  source recovers (error → ready) while the card is on screen, the
  interrupted conversion finishes BY ITSELF — the user already asked
  for it (verified end-to-end in the browser: mock 500s → card +
  countdown → unmock → result popup appears with no user action).
- **First snapshot-store unit tests** (web, backlog #29 partially
  closed): boot hydration + per-source freshness (12-min frankfurter
  local snapshot not stale, no fetch; 16-min refetches), the full retry
  ladder (15/30/60 escalation, cap at 60 s, success clears + no zombie
  retries), degraded no-poll, offline no-schedule + online-event
  takeover, ensureSnapshot semantics. Fake timers, faked fetchRates,
  in-memory localStorage.

### Changed
- **WCAG contrast sweep — raw `text-currena-warning` ink**: every
  user-facing warning TEXT rendered with the raw coral `#FF6B6B`
  (≈2.9:1 on light surfaces — fails AA) now uses the I6 `-deep` token
  (`#B92E2E` light ≈ 6.0:1 / `#FF8080` dark ≈ 6.6:1): the failure-card
  title + countdown, StaleBanner title (converter + LiveRates), Insights
  load-error + from-cache banner titles, Splitter network-error line,
  BatchConverter invalid-line label, AmountInput validation message,
  Receipt clear button, Insights card history-error. Measured in-browser
  before/after; dark mode is token-neutral (both map to #FF8080).
- **Admin runtime-config card**: the fresh-window line now shows the
  per-source values («300s / 900s») with the rationale hint.
- **Entry budget bumped 293 → 296 kB raw / 88 → 89.5 kB gz**
  (scripts/check-bundle-budget.mjs): the retry ladder + failure card +
  11 copy strings × 2 locales on the money page. gzip +1.49 kB for
  first-visit-outage recovery — incident-driven resilience, not bloat.
  Insights chunk untouched (128.42/37.78 vs 132/39).

## [2026-10-08] — I11 live-rate wave + rates-ladder incident hardening

Fourth round of the day. Production QA surfaced a REAL incident: starting
19:52:30 UTC, KV writes on the RATES namespace failed — first totally
(19:52–~20:10, cron included: status/history froze, the SPA masked tgju
via SW cache while frankfurter visibly 500'd), then selectively (the
cron's writes recovered while HTTP-context writes — by elimination the
single-flight lock PUT — still failed from at least the HKG colo, so
`/api/rates` + `/api/convert` 500'd instantly during every TTL-expiry
window with a good snapshot sitting in KV). Root cause beyond "KV
writes failing from fetch context" needs `wrangler tail` (owner —
DEPLOY.md incident note has the runbook); the daily-budget hypothesis
was tested against the evidence and DISPROVEN. The code answer shipped
regardless: the ladder now degrades exactly as its spec promises
(stale-cache rung instead of a 500) — turning this entire incident class
into a "Using cached rates" notice. And the converter homepage gains
the one thing every rate site answers instantly — the pair's live rate,
always on. Tests 555 → **575 green** (+6 api incident-degradation, +14
web LiveRateLine helpers). Production still serves the I6 Worker
`954f0034` (deploy pending, owner credentials).

### Fixed (production incident 2026-10-07 19:52 UTC)
- **`RatesService.getRates` store-failure degradation**: a snapshot READ
  failure now treats the cache as absent and continues down the ladder; a
  status-read or lock-acquire failure SKIPS the live rung entirely (the
  single-flight lock is a store guarantee — no lock, no scrape) and falls
  to the cached rungs — stale-with-notice when a ≤7-day snapshot exists,
  the honest 503 `source_unavailable` otherwise. Only `RatesServiceError`
  ever escapes the service now; the route's 500 backstop becomes
  unreachable for store errors. +6 unit tests replaying the incident
  (writes-dead + fresh-TTL-expired → stale cache with notice, status-read
  failure, snapshot-read failure with a working scraper, forced refresh
  semantics, and the exact 19:57 UTC sequence). Docs: DEPLOY.md incident
  note with the write-budget math and owner recommendations.

### Added
- **LiveRateLine (converter homepage)**: the selected pair's mid-market
  rate is always visible between the currency row and the CTA — previously
  it only existed inside the result popup, so "what's the dollar?" needed
  an amount + a tap. Pure local math over the already-booted snapshot
  (swap/currency changes re-render instantly, zero network): rate +
  inverse display (legacy precision rules — Toman integers, 4 decimals,
  8 for sub-1), `SourceBadge` (TGJU/Frankfurter), relative freshness
  («Updated 2 minutes ago» / «به‌روزرسانی ۲ دقیقه پیش»), ▲/▼ delta vs
  the previous recorded generation (`RateDeltaChip`), a 40-point
  `Sparkline` from the same rate-history the ResultPopup micro-trend uses
  (LTR axis in fa — documented analytical-axis decision), and a copy
  button producing a localized share line
  (`1 Euro = 295,260 Iranian Toman · Currena — currena.ir` /
  «۱ دلار آمریکا = ۲۳۰٬۵۰۰ تومان ایرانی · کورنا — currena.ir») with a
  2-second "Copied!" acknowledgment (clipboard failures no-op, same
  pattern as the Insights share pill). Honest states: hidden for
  same-currency pairs, pairs unresolvable from the pair's snapshot (the
  conversion itself would fail identically), no snapshot yet, and while a
  custom rate overrides the market; a confirmed-stale snapshot tints the
  line warning-amber with a ⚠ freshness line instead of hiding it. Pure
  helpers (`liveRateView`, `sparklineWindow`, `rateDecimals`,
  `rateShareText`) unit-tested in `lib/live-rate.test.ts` (+14 web tests).
- **Popular pairs (first-run)**: until the first conversion exists the
  pair-chips section shows five TGJU open-market suggestions (USD/EUR/
  GBP/AED/TRY → IRR) instead of nothing — first-time visitors see what
  the app is for; after the first conversion their own recents take over
  (existing behavior). Same chip DNA, 🔥 label («جفت‌ارزهای پرطرفدار»).

### Changed
- **Print polish (converter)**: the rate line PRINTS (it is the headline
  number on paper — verified in the PDF text layer); the interactive
  chrome around it (pair chips, quick tools grid, copy button) gains
  `.no-print`. Reduced-motion discipline: the quick-amount and pair-chip
  hover lifts are now `motion-safe:`-prefixed.
- **Entry budget bumped 289 → 293 kB raw** (scripts/check-bundle-budget.mjs,
  gz unchanged at 88): the LiveRateLine + popular pairs grow the entry
  288.80/86.98 → 292.57/87.88 — raw +3.77 kB but gzip-NEUTRAL (under the
  88 kB gz budget), i.e. users download ~zero extra bytes. The money page
  answering "what's the dollar?" without a conversion is the
  highest-value entry growth since launch. Insights chunk untouched
  (128.41/37.79 vs 132/39 budget).

## [2026-10-08] — I10 personal & portable wave: watchlist pins, .ics export, reading progress, relative freshness

Third round of the day, autonomously scoped after a clean QA sweep (production
+ local all green; API 30 readings / 0 unavailable / 14 events). Four features
close the loop on "a page readers return to": personalisation, portability and
orientation. Tests 545 → **555 green** (+10: 4 pinned-storage, 6 RFC 5545).
Presentation-layer only — no scoring, thresholds, sources, KV keys or API
changes. Production still serves the I6 Worker `954f0034` (deploy pending,
owner credentials).

### Added
- **Personal watchlist ("My watchlist" / «دیده‌بان من»)**: every card's
  expanded action row gains an aria-pressed pin pill (☆/★, house pill DNA);
  pinned cards MOVE into a dedicated section above the groups — "stay on
  top" — with its own warning-count line (the pinned set's own status,
  group headers keep describing full data). Persisted in localStorage
  (`currena.insights.pinned.v1`; `parsePinnedIds` degrades any malformed
  value to "nothing pinned", unknown ids drop silently) and synced across
  tabs via the `storage` event. The collapsed card shows a ★ badge (in the
  expand button's accessible name via sr-only text) so pin state reads
  without expanding. Play-nice with everything that locates cards by DOM
  id: share deep links (`?card=` opens + scrolls to a pinned card),
  WhatChanged rows, focusCard's filter-reset (a hidden pinned card is
  found after the filter clears), JumpNav gains the watchlist pill, the
  section hides under the no-match state. Pure helpers unit-tested.
- **Calendar export (.ics)**: the Coming up header gains a "Download
  calendar (.ics)" pill exporting exactly the events listed (upcoming,
  localized titles). `buildInsightsIcs` in `components/insights/ics.ts` is
  a pure RFC 5545 builder — CRLF endings, TEXT escaping (ASCII `;` `,` `\`
  and newlines; the Persian ؛/، code points correctly untouched), octet-safe
  75-octet folding (never splits a UTF-8 sequence — Persian titles are the
  point), all-day `DTSTART;VALUE=DATE` with the exclusive `DTEND` (+1 day,
  month-boundary verified), stable `<event>-<date>@currena.ir` UIDs so
  re-imports update instead of duplicating, deterministic `DTSTAMP` (now
  passed in tests). Downloads via the shared `lib/download.ts`.
- **Shared download helper** (BACKLOG #24): `downloadBlob` extracted from
  its two route-local copies (Receipt PNG/XLSX, BatchConverter CSV) into
  `apps/web/src/lib/download.ts`; the Insights export is its third consumer.
- **Reading progress bar**: a 3px `role="progressbar"` pinned above the app
  header (z-1001), filling from the inline-start edge in both directions
  (RTL grows from the right — native block flow). rAF-throttled passive
  listeners (the JumpNav scrollspy pattern); `aria-valuemin/max/now` keep it
  honest; hidden on paper.
- **Relative freshness**: the header's generated line now reads
  "Updated {ago} · {exact datetime}" ("3 hours ago", «۳ ساعت پیش») via the
  existing core `formatRelative` (zero entry-bundle growth — it was already
  there); the from-cache banner leads with the relative age too (the exact
  timestamp stays one line above).

### Fixed
- **Persian-digit sweep (fa prose numbers)**: section headers, group headers
  and the days-away counter rendered Latin digits («3 از 6 شاخص», «21 روز
  دیگر») while values, charts and chips used Persian digits. All prose
  numbers now render through `formatNumber(numberLocale)` — «۳ از ۶ شاخص
  در وضعیت هشدار», «۲۱ روز دیگر», the excluded-note count, and the new
  watchlist count line. The LED seven-segment values stay Latin by the
  documented Wave-5 #46 decision.

### Budget
- Insights chunk 121.30/35.85 → **128.36/37.78 kB/gz** — gate consciously
  bumped 125/37 → 132/39 with this entry as justification (watchlist UI +
  section + persistence, ics builder, progress bar, digit sweep, 9 new copy
  strings × 2 locales). Entry untouched: 288.80/86.98 vs 289/88.
  Precache 61 entries.

## [2026-10-08] — I9 feedback & analytical-zoom wave: chart ranges, chip counts, summary jumps, "/"-shortcut

Second stable-state round of the day: re-verified production + local standing
state (all green), fixed one I8 gap found during review, then four features.
Tests 528 → 537 → **545 green** (+8 range/count tests). Presentation-layer
only — no scoring, thresholds, sources or API changes. Still awaiting the
owner-credentialled deploy (production serves I6 Worker `954f0034`).

### Fixed
- **focusCard × filter interaction (I8 gap)**: clicking a WhatChanged row
  (or any focus-card path) while the active filter hides that card used to
  silently do nothing visible. The reader's "show me THIS card" intent now
  wins — the filter resets (chips + query), then the card opens, scrolls
  and receives focus.

### Added
- **Chart range toggle — 10y / 5y / 1y** (`HistoryChart`): a segmented
  control in the figcaption (the house pill DNA at chart-local size).
  `sliceHistoryToRange` / `rangeIsPlottable` are pure, unit-tested helpers
  in `config.ts`; the window anchors on the series' LAST point (honest even
  when the feed is days old); ranges that cannot show ≥2 points disable
  themselves; the mid-axis year tick suppresses itself when it would repeat
  an end year (1y windows show exactly 2 ticks); the I7 tooltip + keyboard
  stepping operate on the sliced series; the SR data table follows the
  visible range. **The 10-year position bar and percentiles never change**
  — they are the indicator's server-side decade placement. Hidden on paper.
- **Live counts on the filter chips** — "All (30) / Warning (6) / Normal
  (15) / Context (7)": the reader sees what a chip does before pressing it
  (`statusCounts`, pure, tested; Persian digits in fa). Same semantics as
  the filter: stale/unavailable count only under All.
- **Summary lines are jump buttons**: the two LED summary lines now scroll
  to their sections — the summary block doubles as the page's table of
  contents (hover affordance, direction-neutral ↓ chevron, sr-only "View
  section", reduced-motion-aware).
- **"/" focuses the filter search** — Gmail/GitHub/YouTube muscle memory.
  Ignores modifier combos (never swallows browser shortcuts) and never
  fires while typing in any field; `aria-keyshortcuts="/"` declared on the
  input.

### Changed
- **Insights chunk budget 120/35.5 → 125/37 kB/gz**
  (`scripts/check-bundle-budget.mjs`): the range control + slicing, chip
  counts, summary buttons, shortcut wiring and 12 more copy strings × 2
  locales grow the lazy chunk 117.27/34.83 → 121.30/35.85. The entry chunk
  is untouched (288.76 kB / 86.95 gz — money-page budget held).
- Spec §5 (indicator card) now records the range control and §4 the summary
  jump behaviour (additive documentation).

## [2026-10-08] — I8 findability wave: filter toolbar, story→card links, hover polish

Stable-state session: full QA pass first (production standing state + every
Wave 6 feature re-verified locally with agent-browser — share links, chart
tooltip/keyboard, print, zero errors), then the next coherent improvement.
30 cards across two sections is a lot to scan; three presentation-layer
changes, no scoring/threshold/API contract changes. Tests 528 → **537 green**
(+9 filter tests). Not yet deployed — ships with the Wave 6+ work at the next
owner-credentialled deploy (production still serves I6 Worker `954f0034`).

### Added
- **Card-grid filter toolbar** (`FilterBar.tsx`, new): status chips
  (All / Warning / Normal / Context — 44px pills, `aria-pressed`, the I6
  deep-ink active tones) plus text search over name + ticker. Persian
  search is normalised like a native would expect: Arabic-keyboard
  yeh/kaf map to Persian, ZWNJ acts as a word separator, bidi marks are
  stripped — «بیت کوین», «بیت‌کوین» and «بيكاري» all match their cards.
  The result count line is `aria-live` with a Clear-filters reset;
  fully-filtered-out sections, groups and JumpNav pills hide; a no-match
  panel replaces the grid; the toolbar is hidden on paper (`.no-print`).
  Filtering is a VIEW tool only — section/group warning-count lines keep
  describing the full snapshot, and stale/unavailable cards only appear
  under All.
- **Story blocks now link into the grid**: every WhatChanged row (state
  changes + the five biggest 30-day moves) is a button that opens and
  scrolls to its indicator card through the shared `focusCard` path (the
  I7 share-link behaviour, extracted); the chevron mirrors per locale and
  the accessible name carries "View card".
- **Pure filter helpers** in `config.ts` (`indicatorMatchesFilter`,
  `filterVisibleIds`) with 9 unit tests incl. the Persian-normalisation
  cases.

### Changed
- **Insights chunk budget 110/33 → 120/35.5 kB/gz**
  (`scripts/check-bundle-budget.mjs`): the toolbar + visibility wiring +
  26 copy strings × 2 locales grow the lazy chunk 109.36/32.91 →
  117.27/34.83 — a conscious, justified bump; the entry chunk is
  untouched (288.76 kB / 86.96 gz, money-page budget held).
- **Card hover polish**: desktop-only, `motion-safe` 2px lift + deeper
  shadow on indicator cards (reduced-motion and touch unaffected).
- Spec §4 (page structure) now records the toolbar row between "Coming
  up" and the sections (additive documentation of the I8 change).

## [2026-10-07] — BACKLOG Wave 6 closed: CI gate, chart tooltip, print, share links, ingest alerting

Owner direction ("Proceed based on your phases") → the ranked Wave 6 backlog
from the I6 session, completed end-to-end. Tests 521 → **528 green**; every
commit CI-verified on GitHub (the new gate itself, green on each push).

### Added
- **CI workflow** (`.github/workflows/ci.yml`, BACKLOG #47): every push to
  main + PRs runs typecheck, the full test suite, the SPA build, and a
  **bundle-budget gate** (`scripts/check-bundle-budget.mjs`) — entry chunk
  ≤ 289 kB / 88 kB gz, Insights lazy chunk ≤ 110 / 33; budgets are the
  documented numbers and bumps require a changelog justification.
- **Chart hover/focus reading** (#48, audit F16): pointermove tracks the
  nearest point on the 10-year chart (dashed guide line + highlighted dot +
  date/value tooltip — Jalali + Persian digits in fa); the chart is
  keyboard-focusable with ←/→/Home/End stepping; `touch-pan-y` keeps mobile
  scrolling intact; the SR data table remains the text path.
- **Per-indicator share links** (#50, spec §10 "later"): the hash router is
  now query-tolerant (`parseRouteAndQuery`, pure + 7 new unit tests);
  `#/insights?card=<id>` opens exactly that card and scrolls to it once per
  mount (single-open discipline on phones; unknown ids ignored); each
  expanded card carries a "Share this card" pill (en / «اشتراک این کارت»
  fa) that copies the deep URL with inline "Link copied" feedback.

### Changed
- **Print stylesheet** (#49, audit F16): `@media print` in index.css — dark
  mode prints the light palette, header chrome/nav pills hidden (logo kept),
  cards/sections/figures never break across pages, external links spell out
  their URL, SVG/LED colors kept exact. Verified via PDF export + VLM
  review.
- **Jump targets land below the fixed header**: Insights sections + the card
  anchor get `scroll-mt-24` (the About route's existing convention) —
  JumpNav jumps and share deep links no longer hide their target's title
  behind the navbar.
- **Failed-ingest alerting** (#46): a `if: failure()` Telegram step in
  `insights-ingest.yml` — posts run/sha/URL to the owner when
  `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` secrets exist, a clean no-op until
  then (red run + the 36 h /admin staleness pill remain the standing
  signals).

### Verified
- Local: every feature agent-browser-verified en+fa × desktop/375px (tooltip
  values + keyboard stepping, deep links desktop + mobile single-open,
  clipboard flow with stubbed API, print PDF URL spelling, zero console
  errors, no overflow). CI: **5/5 runs green** on GitHub.
- Bundle: entry 288.76 kB / 86.95 gz (≤ budgets); Insights chunk
  109.36 kB / 32.91 gz after tooltip + share (inside the 110/33 gate —
  growth justified above).

## [2026-10-07] — Insights UI/UX pass (Phase I6) + completeness sweep (I6 backtest re-run + I7 hardening)

Owner agenda ("Improving UI/UX of the Insights page, and making sure nothing is
left behind"). Presentation-layer only — no scoring, thresholds, sources, KV
keys or API contracts touched. Evidence-first audit
(`docs/insights/05-ux-audit-I6.md`) → five implementation commits → backtest
re-run → I7 hardening → production smoke.

### Fixed — Accessibility (audit F1–F5, F7, F10)
- **WCAG AA in light theme** (was failing on all 30 cards): status chips
  2.78–3.29:1, group h3s 3.14:1, panel h5s + source pill ~3.3:1, latent
  what-changed rows 2.78:1, coming-up "soon" coral 1.92:1. Four ink-grade
  `-deep` accent tokens added to the theme (blue #245E9F, success #256D29,
  warning #B92E2E, coral #9C5019 — ≥4.5:1 on white, page bg, and their own
  /10–/15 tints); dark mode remaps them to the existing bright hues
  (≥6.5:1). Both themes re-measured programmatically: 4.62–10.47:1.
- **Stale-card grey-out no longer sinks text below AA** (was 2.33:1 light /
  1.96:1 dark through a blanket opacity-60): grey-out is now a softened
  surface tint + muted value colour with every string ≥4.5:1.
- **Tap targets**: JumpNav pills 30→44px; chart-data `<summary>` 16px→a
  full-width 44px row; "How this is calculated" + disclaimer links get
  padded hit areas (layout unchanged).
- **Accessible names**: the card expand button's name was the entire
  collapsed card (~33 words); heading + button are now labelled
  "name (+ticker), status" via `aria-labelledby`.
- **Summary block landmark** was labelled "Global" (duplicate of the real
  Global section) with no heading — now `ui.summaryTitle` (en "Market
  summary" / native fa «خلاصهٔ وضعیت بازار») + a visually-hidden h2.

### Fixed — UX (audit F6, F8, F9, F11–F15)
- **JumpNav scrollspy**: active-section awareness while scrolling (passive
  rAF listener, `aria-current="true"`, tinted active pill; bottom-of-page
  pins the last section).
- **Chart year labels** no longer carry thousands separators ("2,016" /
  "۲٬۰۱۶" → "2016" / "۲۰۱۶" — `formatNumber` learns `useGrouping:false`,
  formatter-cache key extended); a **mid-axis year tick** orients the
  decade span; position bar 8→10px with a 30% warning-zone tint.
- **Expanded panel readability**: rule sentence text-xs→text-sm, section
  titles 0.72→0.75rem with more lead-in, sections gap-3→gap-4 — the five
  blocks scan as anchors instead of a wall of text.
- **fa typography**: Jalali date+time joined with the Persian comma «،» in
  core `formatJalaliDate` (ICU emitted a Latin ", ") — also fixes the
  converter ResultPopup timestamp.
- Card footer/group status/meta lines 0.68→0.7rem; disclaimer bar softened
  to read as a footnote, not a system alert.

### Changed
- `docs/insights/BACKTEST.md` regenerated against the full 30-indicator
  definition set: `gold-usd`/`silver-usd` reported honestly as info-only
  never-votes (was "undefined"), `china-pmi`'s note reflects its populated
  10-observation manual series; zero numbers changed, I1 findings
  re-affirmed with an I6 re-run verdict. No threshold changes proposed.
- `/admin` Insights card (I7): pill flips to "stale — no run for N h" with
  a `role=alert` action line past 36 h without a run — previously a dead
  cron kept the card "healthy" while the snapshot aged. Live-verified
  fresh + stale paths on local wrangler.
- `docs/BACKLOG.md` Wave 6: post-I6 SWOT re-check + explicit backlog
  (failed-ingest push notification, performance-budget CI gate, chart
  hover tooltip, print stylesheet, per-indicator share links).

### Verified
- Every commit: typecheck 5/5, tests green **516 → 521** (core +2 useGrouping/
  Jalali-comma, admin +3 staleness), bundle budget held — entry 288.75 kB /
  87.77 kB gz unchanged, Insights lazy chunk 104.54 → 105.98 kB (31.49 →
  31.94 kB gz, +0.45 gz for scrollspy + labels), precache 60 / ~2172 KiB.
- agent-browser en/fa × desktop/375px × light/dark: contrast sweep
  re-measured, RTL geometry intact, Persian digits + Jalali dates, chart
  LTR-in-fa, mobile single-open, language switch keeps scroll + open
  cards, zero console errors, no horizontal overflow.
- Production standing state: `/api/health` ok; `/api/insights` 30 readings,
  fresh `generatedAt`, 14 calendar events, quiet week, Global-first order
  (first Australia id at index 18); history endpoints 200 + 404-for-single-
  point + 400-unknown + ETag 304; today's scheduled (04:20 UTC) and
  dispatched ingest runs green on the Actions tab.

## [2026-10-07] — Session wrap-up: shipped state re-verified + next-session brief

Owner direction ("Proceed to next phase if anything is remaining and wrap up
this session… The new session agenda: Improving UI/UX of Insights page, and
making sure nothing is left behind"). No runtime changes — the evening
re-verified the 2026-10-07 feature set end-to-end and closed the session.

### Verified
- Gates re-run: typecheck 5/5, tests **516/516 green** (core 157 · scraper
  67 · insights 132 · web 52 · api 108).
- Production smoke (`currena.ir`): `/api/health` ok; `/api/insights` 30
  readings — `gold-usd` 4107.7 / `silver-usd` 60.109 at the top of the
  metals group, all 18 global ids before the first Australia id, 14 calendar
  events, fresh `generatedAt`, zero unavailable indicators.
- Redeploy from the final HEAD (version of record in
  `docs/DEPLOY.md` §"Session wrap-up, 2026-10-07 evening") — runtime
  identical to the deployed `b69375c` build; docs-only commits around it.

### Changed
- `docs/NEXT_SESSION_PROMPT.md` rewritten as the hand-off brief for the next
  agenda: **Insights UI/UX pass + completeness sweep** (Phase A audit against
  `02-page-design-spec.md`, Phase B presentation-layer improvements, Phase C
  = the I6 backtest re-run + I7 hardening checklist + standing-state
  verification).
- `docs/PROGRESS.md` status row + decisions log: owner direction recorded
  (I5 effectively closed; next phase reframed as the UI/UX agenda).

## [2026-10-07] — Insights: gold and silver ounce prices in the precious-metals group

Owner request ("I want the ounce price of Gold and ounce price of Silver to be
added in the precious metals part"): two new info-only cards at the top of
**Metals, crypto and hard assets** — `gold-usd` and `silver-usd`. They render
first in the group (prices before the ratios built from them), never vote, and
so leave every summary count unchanged. 30 indicators total (19 P1 / 11 P2).
Tests 514 → **516 green**; typecheck 5/5.

### Added
- `gold-usd` — Gold price (ounce), US$ per troy ounce: live TGJU world-market
  ounce quote with World Bank Pink Sheet monthly history backfill (the exact
  `gold-silver` recipe with the raw price as the live point). Displayed as
  `US$4,104`-style whole dollars; carries the 10-year position bar and chart.
- `silver-usd` — Silver price (ounce), US$ per troy ounce: live gold-api.com
  XAG spot with the same World Bank monthly backfill. Displayed to 2 decimals
  (`US$60.13`).
- Bilingual copy corpus entries (en + native fa) for both cards; spec table
  amendment in `docs/insights/01-indicator-spec.md`.

### Changed
- `IndicatorIdSchema` (core contract), `DEFINITIONS`, `buildIndicatorSeries`
  and `READING_SOURCES` (@currena/insights), `DISPLAY` (apps/web) — the two
  ids wired through every layer; degradation ladders tested (no World Bank →
  single live point; no live source → monthly history reads stale, honest).
- Count-pinning tests updated (core id set 30; definitions 19/11; snapshot 30
  readings; fa copy coverage 30 keys).

### Deployed
- Worker version `b1a5e80e-b61e-4f21-994d-4342557de5ba` (922.73 KiB upload,
  gzip 159.88 KiB, 15 new assets) — live on currena.ir + workers.dev; entry
  bundle byte-identical to the I5 baseline.
- Ingestion dispatched manually (Actions run 37646617580, `success` on
  `b69375c`): production snapshot `generatedAt 2026-10-07T15:46:25.777Z`,
  30 readings — `gold-usd` 4107.7 and `silver-usd` 60.109, both `context`
  with ≈92% 10-year position; new `insights:hist:gold-usd|silver-usd` keys
  (120 points each); voting counts unchanged (global 3/11, australia 3/10).
  Browser-verified en+fa, desktop+375px: cards lead the metals group, charts
  + SR tables + source links render, zero console errors, no overflow.

## [2026-10-07] — Insights Phase I5: content (calendar, china-pmi) + Gate I4 ordering fix

Gate I4 approved (owner: "Approved." + the live `/api/insights` JSON) with
one requested change, applied first: **the Global section now renders
before Australia** — section order (`SECTION_ORDER`), jump-nav target
order, and the summary block's two LED lines all flipped; the design spec
§4 records the owner decision (the original "reader is in Australia"
rationale is retired). Then Phase I5's content work: the key-dates calendar
populated from official schedules and the China-PMI manual series seeded
from documented official releases. Tests stay **514 green**; typecheck 5/5;
the reorder is render-order only (no bundle-gated code changed).

### Added
- `data/insights-calendar.json` — 14 events (2026-10-28 → 2027-05-04):
  RBA cash-rate decisions (2026: 3 Nov, 8 Dec; 2027: 9 Feb, 23 Mar, 4 May —
  from the RBA Board Meeting Schedules page, decision = second day), FOMC
  decisions (2026: 28 Oct, 9 Dec; 2027: 27 Jan, 17 Mar, 28 Apr — from
  federalreserve.gov), ABS CPI releases (Sep quarter 28 Oct, Oct 25 Nov,
  Dec 27 Jan, Jan 24 Feb — from abs.gov.au, cross-checked against the RBA
  homepage "Next update"). Bilingual titles; events within 7 days highlight
  client-side; past events drop off.
- `data/manual/china-pmi.json` — 10 NBS manufacturing-PMI observations
  (2025-12 → 2026-09), every value the official headline cross-checked
  against ≥2 independent reports of the release with month-over-month
  arithmetic reconciled; full provenance table in `data/manual/README.md`.
  The china-pmi card goes live (50.1, normal, +0.30 pts 30-day change);
  its position bar stays hidden until the 30-observation percentile floor.

### Changed
- `apps/web/src/components/insights/config.ts`, `routes/Insights.tsx`,
  `components/insights/SummaryBlock.tsx` — Global before Australia
  (section order, jump nav, summary rows).
- `docs/insights/02-page-design-spec.md` §4 — page structure reordered to
  match the owner's decision; rationale line rewritten.

### Documentation
- Roadmap: I4 exit records Gate I4 approval + the ordering change; the I5
  checklist closed out (copy corpus delivered in I4 + re-reviewed with a
  mechanical no-buy/sell check; calendar populated; disclaimer reviewer
  declined at D4; china-pmi seeded as an added I5 item).
- `data/manual/README.md` — china-pmi provenance table + growth rule.

### Deployed
- Pushed `f3a8101..f77bdd4` to `main` and redeployed the Worker (version
  `bef6f65b-e5b6-4655-8d14-25f7945b2e19`, 922.70 KiB upload, 13 new assets —
  the reordered `Insights-oh-TxMJf.js`). A manually dispatched
  `insights-ingest` run (Actions run 37641720806, success) wrote the first
  production snapshot carrying the calendar (14 events) and the live
  china-pmi reading (50.1, normal) — zero unavailable indicators. Verified
  on `currena.ir/#/insights` in en and fa: Global before Australia in
  sections, jump nav, and summary rows; card expand → chart + table +
  source link; 375px no overflow; zero console errors. Deploy record in
  `docs/DEPLOY.md` §Insights reorder + I5 content deploy.

## [2026-10-07] — Insights Phase I4: the page

Gate I3 approved (owner: "Approved." with the live `/api/insights` JSON
pasted for review). Phase I4 builds the reader-facing page: `#/insights`,
28 expandable indicator cards, both languages, both themes, every state in
the design spec. **Entry bundle +0.10 kB gzip** (288.75 kB / 87.78 kB gzip
vs the 288.45 / 87.68 baseline) — the whole feature, including the ~600-line
bilingual copy corpus, lives in the lazy route chunk (100 kB / 30.4 kB gzip).
Tests **479 → 514 — all green** (+35 web); typecheck clean in all five
packages. Browser-verified in en/fa × light/dark × desktop/375px against
the exact production snapshot: zero console errors, no horizontal overflow
(one overflow defect found and fixed during verification), offline fallback
through the last-good localStorage snapshot, mobile single-open cards.
Deployed and smoke-verified on currena.ir — awaiting the owner's visual
review (Gate I4).

### Added
- `apps/web/src/routes/Insights.tsx` — lazy `/insights` route (ROUTES, nav
  entry, per-route title). Australia before Global, jump links, about-the-data
  + full disclaimer.
- `apps/web/src/lib/insights.ts` — typed API client (zod-validated snapshot +
  per-card history with expected-404 → null), localStorage last-good fallback.
- `apps/web/src/i18n/insights-copy-en.ts` / `insights-copy-fa.ts` — the copy
  corpus (28 indicators × 6 fields + structural strings per locale), lazy in
  the route chunk, fa compile-time shape-checked against en.
- `apps/web/src/components/insights/` — SummaryBlock (LED warning counts +
  explainer + disclaimer bar), WhatChanged, ComingUp, JumpNav, IndicatorCard,
  HistoryChart (+ screen-reader table), PositionBar, StatusChip, AboutTheData,
  display config + pure helpers.
- 35 web tests: client contract/error/cache paths, value/change/rule
  formatting (en + fa), warning zones, movers ranking, group counts, history
  sampling, copy coverage.

## [2026-10-07] — Insights Phase I3: ingestion runner, storage, API routes, production write-run green

Gate I2 approved ("continue proceed"). Phase I3 builds the feature's serving
pipeline end to end: the GitHub Actions ingestion runner, the KV storage
contract, the read-only API routes, and the admin freshness card. **First
Insights deploy** (new routes on `currena-api`, Worker version `3ab1a97a`;
the SPA bundle is unchanged — insights imports are type-only on the worker
side). Tests **441 → 479 — all green** (+38); typecheck clean in all five
packages. Production evidence: venue dry-run (Actions run 37518740313)
27/27 sources OK; real write-run (Actions run 37550035289) wrote 24 history
keys + snapshot + status in 26 KV writes with `P1 COMPLETE`; live JSON
verified at `/api/insights` on workers.dev and currena.ir.

### Ingestion runner (`packages/insights`)

- `scripts/ingest.ts` — the production twin of live-run: collect → assemble →
  score → write. Loads `data/insights-calendar.json` + `data/manual/*.json`
  (soft-absent, loudly validated when present), reads the previous snapshot
  for `changedThisWeek` continuity (fresh events carried, week-window
  filtered), writes `insights:snapshot` + `insights:status` (critical) and
  `insights:hist:<id>` only on change (read-compare), prints the source
  report + readings + KV-op budget. Exit 1 when any P1 indicator is
  unavailable — a red workflow run is the stale-feed signal.
- `src/adapters/collect.ts` — the live-run fetch phase extracted verbatim so
  the diagnostic script and the runner cannot drift (live-run refactored onto
  it; output unchanged).
- `src/adapters/snapshot.ts` — pure assembly: `buildInsightsSnapshot`
  (readings + summaries + changedThisWeek merge + calendar),
  `buildHistoryFile` (10-year window anchored on the newest observation,
  downsampled to ≤520 points, `[epochDay, value]` encoding; single-point live
  cards get no history key), `buildInsightsStatus`.

### Storage contract

- `@currena/insights/store` (new export entry): `InsightsReader` /
  `InsightsWriter` interfaces + key names + `InMemoryInsightsStore` (tests) +
  `RestInsightsStore` — the Cloudflare REST KV writer with injected fetch,
  429/10048 daily-cap retry ladder, and op counters. The SPA-facing root
  export stays untouched.
- Core wire contracts: `IndicatorHistory` (strictly-ascending epoch-day
  pairs), `InsightsStatus` + `InsightsSourceReport` (admin freshness).
- `apps/api/src/adapters/insights-store.ts` — `KvInsightsReader` (the
  Worker's read half, poisoned-entry defense like `KvRateStore`). Keys live
  in the existing RATES namespace under the `insights:` prefix, NO TTLs.

### API + admin

- `GET /api/insights` — the precomputed snapshot; `503 insights_not_ready`
  before the first run; ETag `"insights:<generatedAt>"` + 304s; 60s public
  cache; exactly ONE KV read.
- `GET /api/insights/:id/history` — one indicator's downsampled series;
  `400 invalid_indicator` / honest `404 history_not_found`; ETag + 304s;
  300s public cache.
- `/admin` gains a zero-JS Insights card (last run, mode, per-source ✅/❌
  rows) fed by `insights:status`; the read is failure-tolerant (a broken KV
  read omits the card, never breaks the console).

### Workflow + ops findings

- `.github/workflows/insights-ingest.yml` — the repo's first workflow on
  main: cron **04:20 UTC daily** + `workflow_dispatch` with `dry_run`;
  pnpm from `packageManager`, frozen lockfile, 15-minute timeout, no
  overlapping runs.
- **KV write-budget finding (pre-existing, refined by live observation)**: the
  account's write counter crosses the 1,000 free writes/day around ~19:00 UTC
  (ever-green rates cron ~1,000/day + the second worker ~450/day). The cap's
  enforcement was observed on the **KV REST API** (429/10048) — the exact
  path the ingestion runner uses; Workers **binding writes are not blocked**
  (the rates app kept writing fresh snapshots after the trip, so production
  is unaffected). The ingestion is therefore scheduled at 04:20 UTC into the
  fresh post-midnight counter and retries capped writes. Recorded in
  docs/PROGRESS.md decisions log + docs/insights/03-data-sources.md §Phase I3.
- Scope cuts recorded: Bitstamp 10-year candle backfill + RBA F11 skipped
  (no v1 consumer); one daily schedule instead of daily+weekly
  (change-detected writes).

## [2026-10-06] — Insights Phase I2: source adapters, venue-verified RBA, live-run green

Gate I1 approved ("Continue." — backtest thresholds locked as-is). Phase I2
builds the feature's data layer — **still no app code; web/api bundles
unchanged; nothing deployed.** Tests **400 → 441 — all green** (insights 69 →
110); typecheck clean in all five packages; runner-side gates green from the
ingestion venue.

### Source adapters (`packages/insights/src/adapters/`, via `@currena/insights/adapters`)

- Import surface SPLIT from the pure root export: the SPA-safe `.` entry
  stays platform-/fetch-free; the new `./adapters` entry carries the fetch
  halves (web-standard fetch only — runs identically in the GitHub Actions
  runner and a Worker). `@currena/insights` gains a `@currena/scraper`
  dependency (fetchWithRetry + the production TGJU gold parser).
- fred / frankfurter / abs / worldbank / goldapi / bitstamp / tgju / rba /
  manual-series loader + `derived.ts` (`buildIndicatorSeries` — the
  production twin of the backtest SERIES map: ratio joins, yoy derivation,
  inverse/cross FX, live-point info cards, WB-brent fallback) +
  `READING_SOURCES` (per-card attribution).
- `xlsx.ts` — dependency-free XLSX reader (ZIP central directory +
  `DecompressionStream('deflate-raw')` + shared strings) for the World Bank
  Pink Sheet; the workbook URL is re-discovered from the commodity-markets
  page every run because the thedocs.worldbank.org document hash rotates.
- `parsers.ts` additions: `parseAbsSdmxCsv` (live SDMX response; header-driven
  columns — order varies by flow; sorts unordered answers; skips blank
  OBS_VALUE) and `parseRbaTableCsv` (title/header/metadata rows; both RBA
  date formats; skips pre-scaffolded empty future quarters).
- Loud-failure everywhere: zod response contracts (gold-api, Bitstamp,
  manual), table/series/unit identity checks (RBA prefix, WB header+units,
  ABS DATAFLOW), ascending assertions, ingestion-UA pinned for FRED (its
  Akamai edge hangs on the Chrome fingerprint).

### RBA venue verification (the I0 blocker, closed)

- Temporary branch `probe/i2-rba-venue` + a branch-only workflow ran the
  probe from the GitHub Actions runner: F1.1 / F2 / E2 / F11.1 CSVs all
  **HTTP 200**; the bytes are committed as fixtures. The sandbox stays
  Akamai-403 (loud-unavailable there — honest by design).
- `au-household-debt-arrears` resolved to **RBA E2 'Household debt to
  income'** (the ABS Data API has no household-ratios flow; catalogue
  searched in full). `au-us-10y-gap` cadence daily → weekly (F2 publishes
  T+2..4). I0's "4.60% cash rate" reference note retired (F1.1: 4.36).

### Fixtures & tests

- New recorded fixtures: gold-api XAG/BTC, Bitstamp OHLC, Frankfurter small
  timeseries, ABS SDMX ×5 (live response format), the full real World Bank
  XLSX, RBA F1.1/F2/E2 (venue bytes). 41 new tests (110 total in the
  package), all fixture-backed; the XLSX integration test parses the real
  workbook end-to-end (1960M01 → 2026M09).

### Live run (I2 exit criterion)

- `pnpm --filter @currena/insights live-run` — the one-off manual run that
  fetches every source, assembles all 28 indicator series and prints the
  sanity table + summaries. Final venue run: **27/27 fetches OK, every P1
  indicator printed a sane value (`P1 COMPLETE`)** — Global relaxed 1/8
  voting, Australia cautious 3/10 (0 excluded); TGJU-gold vs gold-api XAU
  0.04%, gold-api BTC vs Bitstamp 0.02%. Sandbox runs identical except RBA
  (403 → unavailable rows, as designed).

## [2026-10-06] — Insights Phase I1: contracts, scoring engine, backtest

Gate I0 approved same day (D4 answered: no disclaimer for v1). Phase I1 adds
the feature's computational core — **no app code touched; the web/api bundles
are unchanged; nothing deployed.** Tests **313 → 400 — all green**; typecheck
clean in all five workspace packages.

### Contracts (`packages/core/src/schemas.ts`)

- New Insights contracts (rule 3 — single source of truth): `IndicatorId`
  (28 v1 ids; licence-blocked items excluded), group/section/cadence/phase/
  source enums, `WarningRule` (the spec's seven atom kinds plus a flat
  `any-of` OR-composite for us10y), `IndicatorDefinition`, `IndicatorReading`
  (status vocabulary: warning / normal / context / stale / no-history /
  unavailable; `value`/`asOf` are null exactly when unavailable — enforced by
  refine), `SummaryLine` (label is null when nothing votes), `ChangedEvent`,
  `CalendarEvent`, `InsightsSnapshot` (unique-id refine). All exported from
  `@currena/core`; contract tests include deliberate shape-pinning.

### New package: `packages/insights` (`@currena/insights`)

- Pure, platform-free (AGENTS.md rule 2): no node:*, DOM, fetch or clock
  reads — every time reference is an explicit parameter (frozen-clock
  friendly). zod-validating throughout.
- `series.ts` — epoch-day date math, binary-search `pointAtOrBefore`,
  `combineSeries` inner join (ratios/crosses), `yoyPctSeries`.
- `parsers.ts` — FRED CSV / Frankfurter JSON / World Bank monthly / ABS
  period parsers; loud failures; missing markers dropped, never zero-filled.
  These are the parse halves of the Phase I2 adapters.
- `definitions.ts` — all 28 indicator definitions, rules verbatim from
  `01-indicator-spec.md`.
- `scoring.ts` — strict-lower 10-year percentiles; threshold rules incl.
  sustained-weeks anchored on the latest observation; percentile tails;
  pct/points change rules with anchor tolerance (sparse series show dashes,
  never mislabelled windows); yoy-negative; consecutive-decline; above-low;
  info → context; stale detection; `computeReading`, `summarize`
  (sections resolved via the definitions table), `changedSince`.
- **69 tests**: table-driven coverage of every rule type plus edge cases
  (empty series, short history, direction, ties, boundaries, frozen clock).

### Recorded fixtures + backtest

- `packages/insights/fixtures/` (14 files + provenance README, captured
  2026-10-06): 10 FRED series (2004+ / full), Frankfurter USD→JPY/AUD/CNY
  (2004→2026-10-05), World Bank Pink Sheet monthly (2004M01→2026M09), ABS
  headline CPI + trimmed mean quarterly, ABS unemployment monthly. RBA
  absent (Akamai-blocked from the sandbox — documented).
- `pnpm --filter @currena/insights backtest` writes
  **`docs/insights/BACKTEST.md`**: weekly frozen-clock runs across GFC 2008,
  COVID 2020, inflation 2022 and calm contrast 2017/2025, plus a today-run.
  Labels move correctly in every window (2008 global peaks *stressed*
  Oct-2008 7/12 and Australia *alarmed* Dec-08→Mar-09; 2022 *stressed* for
  20 of 52 weeks; 2017 *relaxed* 43 of 52; today: global *cautious* 3/11,
  Australia *stressed* 3/6). Engine constants calibrated against the
  fixtures during the run and documented there (stale thresholds from real
  release lags: 3/16/95/190 days by cadence; percentile floor 30 periods;
  observation-anchored sustained window). Owner-tunable candidates are
  listed with recommendations — spec thresholds themselves are unchanged.

Awaiting Gate I1 approval (backtest / threshold review) before Phase I2.

## [2026-10-06] — Insights Phase I0: source verification + Gate I0 decisions

Docs-only session (no code, no bundle impact). Planning set from commit
`240deb1` read in full; the verify-first probe ran against **every** source in
`docs/insights/03-data-sources.md` with throwaway scripts (nothing committed).

### Data sources — verified register (`docs/insights/03-data-sources.md`)

- **FRED:** 11/11 series live and current, **keyless** via
  `fredgraph.csv` (including the identified government pair
  `A091RC1Q027SBEA` ÷ `W006RC1Q027SBEA`) — **no FRED API key needed**.
  All used series are U.S.-government public domain; `DCOILBRENTEU`
  is EIA-sourced.
- **RBA:** licence **CC BY 4.0** confirmed (via alternate egress); the
  whole domain Akamai-403s the build sandbox — CSV bytes must be
  re-probed from the ingestion venue before Phase I2.
- **ABS:** Data API keyless on `/rest/` — `LF`, `CPI_Q`, `ANA_AGG`,
  `RES_DWELL_ST` current; `CPI_M` stale (keyed Indicator API only if
  monthly cadence is wanted); stale RPPI **replaced by `RES_DWELL_ST`**;
  household ratios → `E2` (verify in I2). Licence CC BY 4.0.
- **Silver / Bitcoin (D3):** gold-api.com primary for both spots (terms
  explicitly permit commercial display); Bitstamp public OHLC for BTC
  history; World Bank Pink Sheet (CC BY 4.0, monthly 1960M01→2026M09)
  for silver history and P2 commodities.
- **Blocked (licence/terms/access):** Coinbase (display prohibited),
  CoinGecko free (screenshots-only + 365-day cap), Coin Metrics
  community (CC BY-NC, 7 points), MetalCharts (nonexistent), Cboe VIX
  (link-out only), S&P 500 / breadth (P3), Stooq (bot gate),
  Blockchain.com (API degraded). **Shiller CAPE deferred P2→P3**
  (Yale data frozen at 2023-09, no licence).
- **Re-verified:** TGJU `ajax.json` (963 symbols, gold ounce fresh) and
  Frankfurter (2026-10-05), cross-consistent. China PMI manual-entry
  plan confirmed (no machine-readable NBS feed).

### Gate I0 decisions (recorded in `docs/PROGRESS.md`)

- **D1 — Cloudflare Free, permanently.** Heavy ingestion via a daily
  GitHub Actions runner writing one compact snapshot per source to KV
  through the Cloudflare REST API; the Worker only reads. Compact
  encoding (consolidated keys, arrays, integer-scaled fixed-point,
  epoch-day dates, rendered series only) keeps usage at ~100–150 KV
  writes/day vs the 1,000 free limit — **no indicator is omitted for
  tier reasons**. KV free limits re-verified live (100k reads/day,
  1k writes/day, 1 GB, **1 KV operation per Worker invocation** → the
  single `insights:snapshot` serve path).
- **D2 — substitutes accepted:** STLFSI4 for stress; VIX link-out;
  S&P/breadth out of v1; CAPE to P3.
- **D3 — silver/BTC sources accepted** (gold-api, Bitstamp, World Bank).
- **D4 — open:** disclaimer reviewer nomination (owner; needed before
  Phase I5, not blocking I1–I4).

Awaiting Gate I0 approval before Phase I1 (contracts + scoring engine).

## [2026-09-20] — Owner wireframe homepage + SWOT v2 + reliability wave

4 commits on `main` (`e3896ec` → this session), 2026-09-20.
Tests **308 → 313 — all green** at every gate; bundle gate held
(288.38 kB / 87.65 kB gz initial JS vs the 290.28/87.77 baseline — the
retired sidebar rail more than paid for the new homepage sections);
precache 59 entries / 2049.25 KiB (+1 entry, +6.4 KiB — About legal
sections + CSS). Every change browser-verified locally (agent-browser
DOM geometry + VLM, en + fa, desktop + 375 px, light + dark) and on
production after deploy.

### Phase A — SWOT v2 (fresh audit against today's code)

- **docs:** `docs/SWOT.md` re-run — production re-probed (health/rates/
  status/history/meta/admin/ETag 304 round-trip), `pnpm audit` CLEAN
  (xlsx CVEs long gone), bundle baseline re-measured identical, delta
  read of everything landed since 2026-09-24 (cron, server history,
  gold, LED boards, retry policy, admin gate). New weakness set is
  maintainability-shaped (the monolith files), the old security set is
  retired. `docs/BACKLOG.md` gained Wave 5 (this session's owner UI
  items) with statuses.

### Owner wireframe — homepage single-column stack (the 8 UI directives)

- **feat(web):** homepage rebuilt per the owner wireframe — full-width
  converting box → **GOLD & CURRENCY LED boards two-up** (gold start
  side; both in the compact CURRENT-only placement) → full-width Quick
  tools section → footer. The desktop two-column dashboard and the
  "at a glance" mini-board (`ConverterAside`) are retired; mobile now
  gets the boards too (`dbd05e2`).
- **feat(web):** ONE shared board component, two placements —
  `LedRateBoard`/`LedGoldBoard` take `showDayStats` (default true);
  `false` removes the DAY HIGH/DAY LOW cells from the DOM and collapses
  the shared subgrid ladder to two tracks at EVERY viewport
  (`.led-current-only`, index.css — re-asserts subgrid so column widths
  stay shared). `/live-rates` untouched: full 3-column board verified.
- **fix(web,a11y):** WCAG 1.4.1 — the retired mini-board's color-only
  live dot is superseded by the boards' text LIVE/CACHED/OFFLINE label.
- **fix(web,a11y):** WCAG 1.4.3 contrast — amount placeholder
  #B39B45→#806215 (≈2.7→5.6:1), dark #5B6B80→#9CA3AF (≈2.6→5.5:1),
  caret #C79100→#8A6D1F; "no change" delta pill muted→gray-700/gray-300
  (≈4.0→8.6:1 light, ≈4.5→8.0:1 dark).
- **feat(web):** nav utility group unified — install · فا · theme ·
  hamburger share one bordered icon-button container
  (`HEADER_ICON_BUTTON_CLASS`), equal 40px hit areas, both themes.
- **feat(web):** trust signals — footer carries Privacy · Terms ·
  Contact · About next to the credit line; the About route gains
  Privacy Policy / Terms of Service / Contact sections (en+fa) with
  sessionStorage-staged deep-link scroll; contact = GitHub (the only
  owner-supplied public channel — no email exists in the repo).
- **rtl:** full fa audit re-run across all 9 routes (en+fa, desktop+
  375 px, light+dark): boards mirror to the start side, no overflow, no
  console errors; digit language decision documented — Persian digits
  (۰۱۲۳) in all standard UI text via `Intl` fa-IR, Latin digits inside
  the DSEG7 LED modules (hardware font, matching the board-date rule).

### Phase B — reliability & i18n wave (BACKLOG items)

- **fix(api):** `/api/health` enriched (BACKLOG #39) — version +
  KV reachability probe (cheapest read); KV failure → 503 + `ok:false`
  for monitors; tests for both shapes (`ae6d6d9`).
- **fix(api):** rate limiting (BACKLOG #18) — per-isolate, per-IP token
  bucket (10 burst / 5 per min) on `POST /admin` +
  `POST /internal/refresh`, checked BEFORE body read or secret work
  (kills the wrong-secret KV amplification); 429 + Retry-After; bounded
  map; documented best-effort (per-PoP isolates). 3 tests.
- **fix(scraper):** `HttpError.code` (BACKLOG #33) — machine-readable
  classification (timeout / dns_or_network / rate_limited / blocked /
  http_4xx / http_5xx) derived from status or abort type; flows into
  `errorToCodeMessage` → status/admin telemetry. All six codes pinned.
- **fix(web):** Odometer respects `prefers-reduced-motion` (BACKLOG #34)
  — final value lands immediately, no rAF count-up.
- **fix(web,i18n):** Receipt/Batch export+share paths through the
  dictionary + `formatNumber` (BACKLOG #27) — fa users now get Persian
  labels AND Persian digits in share text, the receipt paper
  (۲۵٫۵۰ TRY / ۱۲۲٬۸۲۱ IRR (تومان)) and Excel headers; bulk-template
  prefill locale-aware; `navigator.share` titles localized (`58135e6`).

### Verification summary

308 → 313 tests (core 134 · web 17 · scraper 66→67 · api 91→95),
typecheck 4/4 at every commit; agent-browser: golden path (100 USD →
result + LIVE UPDATE), footer deep-links scroll to the About sections,
fa RTL mirroring (gold board start-side), Live Rates full board
unchanged (CURRENT + DAY HIGH + DAY LOW, 0 compact tables), zero
console/page errors everywhere; wrangler dev: enriched health JSON +
11th rapid `/internal/refresh` → 429.

## [2026-09-19] — Ever-green rates + LED shopfront boards session

19 commits on `main` (`732d2df` → `d28f57c`), 2026-09-18 evening → 2026-09-19.
Production live at **https://currena.ir** through Workers versions
`093aaf72` → … → `982cbc43` (final). Tests **279 → 308 — all green** at every
gate; every change browser-verified locally (agent-browser DOM audits + VLM)
and on production, en + fa, desktop + 375 px.

### Ever-green data (fixes the "3-hour-stale rates" report)

- **fix(api):** added the `scheduled` handler + cron `* * * * *` — the same
  ladder runs every minute regardless of visitor traffic (tgju each tick,
  frankfurter on 15-min cadence, fresh-guard caps real scrapes at ~1/5 min);
  measured data age with **zero user traffic: ≤ ~5-6 min** (`732d2df`).
- **fix(scraper):** TGJU cache-bust — `?cb=<epoch-ms>` on `ajax.json`, since
  TGJU's own edge served stale HITs (age 30 min on a 5-min max-age).
- **feat(api):** server-recorded rate history — KV `history:<source>`
  generations, content-fingerprint dedupe (writes only on real value changes —
  free-tier safe), capped 240; recorded from cron + live `/api/rates` scrapes;
  new `GET /api/history` (60 s cache + ETag). Sparklines across the app now
  draw from a shared server history merged into each client at boot — the
  "every currency has the same graph shape" report root-caused (identical
  min-max-normalized local series) and truly fixed (`d28f57c`).

### LED shopfront boards (owner-driven visual identity)

- **feat(web):** dot-matrix LED rate board as the Live Rates hero — DSEG7
  Classic (OFL-1.1) price digits, ghost segments + bulb gradient + halo,
  ticking clock, per-value flash (WCAG-safe), honest derived-quote footnote
  (`732d2df`), then rebuilt as a physical panel: bevel → perforated grid →
  recessed wells → ghosts → dot-matrix bulbs (`824257f`).
- **feat(scraper,core,web):** TGJU's real daily stats — current / day-high /
  day-low ride the snapshot `Rate` entries end-to-end; no invented dealer
  spread (`17169ea`). Shared **CSS subgrid** column lock (headers + every row
  share ONE track definition; measured spread 0.0 px per column) + hot CURRENT
  emphasis (`e8c5837`); currency names +40-50 % / weight 700 with a
  name-first caption layout below md (`a475058`).
- **feat(core,scraper,web):** **GOLD & COINS panel** — 9 TGJU gold/coin
  symbols (ounce in USD, Tehran market), graceful per-item dash degradation,
  same panel language (`b622cee`); gold-heal guard self-fixes visitors holding
  pre-gold snapshots (`8ec6842`); Tehran items converted Rial→**Toman** at the
  one sanctioned place (scraper normalizer) with self-migrating legacy
  snapshots (`97292b1`); phones show a single big CURRENT column on both boards
  (`97292b1`).
- **feat(web):** flags at 2× on the name line; headers/clock/dates in readable
  sans (LED look reserved for price digits) (`5fe3abf`); metal bezel frames —
  six-stop 135° steel + gold ramps with specular highlights, glass-recessed
  boards (`4170a96`, `4eacce9`); per-board headings with emoji, live TGJU
  link pill and last-updated stamp (`1204cba`).
- **feat(led):** fa board date as **«28 شهریور 1405»** (Persian month name,
  day-first logical order) then owner-refined to the RTL `[year][month][day]`
  frame at clock size; TGJU wordmark; `$` prefix on the USD gold-ounce
  modules (`2d91461`, `bf08bf8`).

### PWA & honesty fixes

- **fix(web):** "cached rates" banner/LED blink on boot — banners now render
  only on **confirmed** staleness (server-stale generation or failed fetch),
  never the transient boot hydration (`d782264`).
- **fix(web):** PWA `registerType: 'autoUpdate'` + `skipWaiting` +
  `clientsClaim` + hourly `registration.update()` — every deploy self-applies;
  the "stuck on the previous version" report root-caused (waiting service
  worker that a plain reload never activates) and permanently fixed
  (`6c75ccb`).
- **fix(web,api):** SWOT audit round — receipt/share/history staleness unified
  on `isConfirmedStale`; manifest rebranded **Currena** (was installing as
  "CurrencyPro"); og/twitter share cards; worker security headers (nosniff,
  X-Frame-Options, Referrer-Policy, Permissions-Policy) (`4bd5a9b`).
- **feat(pwa):** Android packaging prep — manifest `id`, real store
  screenshots (narrow 390×844 + wide 1280×720, VLM-verified), app shortcuts
  (Live Rates / Calculator), in-app 📲 install CTA (header + side menu, en+fa,
  `beforeinstallprompt`-driven). The site is fully **PWABuilder-ready**:
  paste currena.ir → Package for Stores → Android → signed APK/AAB
  (`1a80012`).
- **fix(web):** mobile result popup compacted — 3 stacked header rows → 1,
  single Jalali+time line, tightened spacing; measured **378 px** tall at
  390×844 (was viewport-filling), desktop unchanged (`d28f57c`).

### Known considerations

- TGJU remains a single upstream (inherent) — mitigated by cache-busting, the
  ladder, honest notices, the gold self-heal guard, and now server-side
  history (trend data survives upstream hiccups).
- Rate history began accumulating at deploy (2026-09-19 ~04:00Z); shapes
  genuinely diverge as TGJU re-quotes over the coming days. Optional future
  work: seed deeper history from TGJU's own history API (scope-guarded out).

### Open items (next session)

See the hand-off prompt in `docs/BACKLOG.md` lineage — SWOT re-run,
modularization of `apps/web/src/App.tsx` and the route monoliths, performance
& reliability optimization, TGJU history backfill, rate-limit on admin POST.

## [2026-09-18] — Autonomous hardening session

Branch `improve/autonomous-session-2026-09-24` (15 commits, +2,598/−491 lines,
49 files). Live in production at **https://currena.ir** since Worker version
`ddde3962-d0f0-4aab-85c4-04e744638185`.
Audit trail: `docs/BASELINE.md` → `docs/SWOT.md` → `docs/SESSION_LOG.md` →
`docs/FINAL_REPORT.md` (open items live in `docs/BACKLOG.md`).

### Headline metrics

| Metric | Before | After |
| --- | --- | --- |
| Tests (pnpm -r test) | 224 | **279 — all green** |
| Known vulnerabilities (pnpm audit) | 2 HIGH (`xlsx`) | **0** |
| Export-feature vendor chunk | 423.9 kB | **5.6 kB** (zero-dep writer) |
| `Intl` number formatting, 10k ops | 19,511 µs | **624 µs** (31× faster) |
| Web precache bundle | ~2,400 KiB | **1,999.67 KiB** (54 entries) |

### Security & data integrity (Wave 1)

- **fix(core):** settle ledger `__proto__` prototype-key corruption — a crafted
  note could poison `Object.prototype` and corrupt every ledger; added a money
  conservation invariant on persist (`a4bff42`).
- **fix(api):** hardened `/admin` + the KV status trust boundary —
  `SourceStatusSchema` validation on cached status, numeric-field HTML escaping,
  opt-in `ADMIN_VIEW_SECRET` gate (401 + `Retry-After`), 8 KB POST body cap
  (`005fae7`).
- **fix(web):** replaced CVE-laden `xlsx@0.18.5` with a zero-dependency XLSX
  writer; audit went 2 HIGH → 0 and the export chunk shrank 423.9 → 5.6 kB
  (`dd4ebc4`).
- **fix(web):** History delete race (identity-keyed delete) + Settle
  hydration-gated persist — closed a data-loss window on remount (`9b64442`).

### Reliability (Wave 2)

- **fix(api):** scrape-ladder reliability — 25 s scrape deadline, 30 s lock TTL,
  token-scoped locks (crash-safe release), graceful KV-write degradation,
  stale-value propagation on source failure; all covered by tests including a
  real-interleaving stampede test (`da8284f`).
- **feat(web):** reliability pass — ErrorBoundary, prompt-mode PWA update toast
  (workbox-window), honest forced-refresh FAB, collision-safe `uniqueId()` for
  entity IDs (`1ced3d1`).

### Performance (Wave 3)

- **perf(core):** memoized `Intl` formatters — `fa-IR` number formatting 31×
  faster (`b38aca9`).
- **perf(api,web):** `ETag`/`If-None-Match` → **304** on `/api/rates`, 5 s
  isolate snapshot micro-cache, parallel `status()` fan-out, memoized
  `<BoardCardView>`, History formatter hoist (`d041fa3`).

### Correctness & hygiene (Wave 4)

- **fix(core):** symmetric tie rounding (banker-style for .5 remainders),
  display-consistent CSV totals, CSV formula-injection guard, `sourceForPair`
  consolidated into core (6 copies → 1) (`c695fb5`).
- **chore(web,scraper):** dead-code removal (priceScanner block, `readHistory`,
  SCRAPER_VERSION sync) + settle settlement-currency label fix (`db3e22b`).
- **test(core):** penny-mismatch assertion fix — empty note renders as an empty
  CSV field (`76dae79`).

### Documentation & process

- **docs:** pre-session baseline snapshot (`bfc7240`); SWOT audit + prioritized
  39-item session backlog from three parallel deep audits (`2aaefff`); session
  log + final report (`9d91ffb`); production deployment record with the
  `printf`-vs-`echo` secret gotcha (`75866ac`).

### Deployment

- Single deployment topology: Worker `currena-api` serves API + built SPA +
  admin console; Custom Domain **currena.ir** + workers.dev URL, bindings (KV
  `RATES`, `ASSETS`) intact, secrets (`REFRESH_SECRET`, `ADMIN_VIEW_SECRET`)
  persist across versions.
- Post-deploy smoke: **12/12 green** — health, TGJU rates, USD→IRR convert
  parity, AED→EUR 503 messaging, admin gate (401/303/cookie), robots.txt, SPA
  deep link, ETag→304, `/api/status` parallel shape, 413 body cap.
- **Admin gate enabled in production.** Rotate with
  `printf '%s' '<secret>' | pnpm --filter @currena/api exec wrangler secret put ADMIN_VIEW_SECRET`
  (never `echo` — it stores the trailing newline and breaks constant-time
  compare). Delete the secret to return to public mode.
- Rollback: `pnpm --filter @currena/api exec wrangler rollback`
  (previous deployment 2026-09-17T03:12Z).

### Open items (prioritized — see `docs/BACKLOG.md`)

1. Owner rotates `ADMIN_VIEW_SECRET` to their own value
2. Legacy pythonanywhere origin decommission (owner decision, outside repo)
3. Cron pre-warmer `[triggers]` decision
4. TGJU Path-B relay (fallback scrape path)
5. Multi-currency settle ledgers
6. zod `.strict()` request contracts
7. Expanded web tests (rate-history, recent-pairs, router, meta parity)

### Wrap-up (2026-09-18 ~16:20 UTC) — pushed & redeployed

- Final gate re-run at HEAD: typecheck **4/4 packages**, tests **279/279 green**.
- `main` (17 commits, through the changelog wrap-up) and branch
  `improve/autonomous-session-2026-09-24` pushed to
  `github.com/assadigit/Currena` — `origin/main` now matches local exactly.
- Production redeployed from the final HEAD to pin the version marker (runtime
  identical to `ddde3962…` — every commit after `9d91ffb` is docs-only).
- Post-deploy smoke re-verified live: health, TGJU rates, USD→IRR convert
  parity, admin gate.
- Credentials hygiene: push/deploy tokens were supplied via environment
  variables only and were never written to disk, config, or git history.

## Earlier history

See `git log` for the pre-session history on `main` (through `bf61524`).
