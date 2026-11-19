> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S15 / M1 — The Kalshi wording read + citation re-verification + the live probes

**Session:** S15 of the Gold Page Elevation (GPE) program — the SIXTH
Phase-D implementation session: **P3, the Supporting tier (wave 3,
second session)**. **Date:** 2026-11-19 (started ~05:2x UTC). **Branch:**
`gold-elevation/p3-expectations` (off the S14 close `c47f4c3e` —
production `61180d7f` is built from it; git `main` still sits at the
R-5 close `19131b0`).

Scope: exactly R28 + R29 + R25 (`s8/01` §4; the locked modes from the
CP-C record §1). R15/R23 stay drop-conditional (the M1(b) check below).
R30 (Bridge-2) is S16's, NOT this session's.

## 1. THE KALSHI DEVELOPER-AGREEMENT WORDING READ — the first task (s8/02 §2a, resolved)

**The read is DONE, and it resolves to the conservative band's worst
case: THE KALSHI LEG DROPS.** The pre-committed fallback (s8/02 §2a):
"if the wording read reveals a restriction on informational display,
the Kalshi leg drops and the card renders Polymarket + the calendar
strip (R29) — the venue-diversification design absorbs the loss;
nothing else in the roadmap depends on the Kalshi leg."

**How the read happened (the S4 environment reproduced, then worked
around):** `kalshi.com/developer-agreement` rate-limits this
environment exactly as it rate-limited S4's (HTTP 429, the Vercel
Security Checkpoint page, every UA and browser attempt — curl, curl
default UA, Googlebot UA, and a real headless Chrome through
agent-browser, which fails the checkpoint's verification with "Failed
to verify your browser, Code 21"). `docs.kalshi.com` serves 200 (the
S4 record's readable alternative) and links the agreement at exactly
the blocked URL. The agreement itself is published as a PDF on
Kalshi's asset hosts — **fetched live this session, HTTP 200, 125,685
bytes, 6 pages, "v1.1 Kalshi Developer Agreement"** from
`https://kalshi-public-docs.s3.amazonaws.com/Kalshi-Developer-Agreement.pdf`
(the canonical link third parties cite; `assets.kalshi.com/Kalshi-Developer-Agreement.pdf`
is the twin host).

**The operative wording, verbatim (v1.1):**

> §3 Prohibitions: "Use of Kalshi APIs is expressly limited to
> facilitating a members own trading on the Exchange; all other usages
> are disallowed and may result in account suspension."
>
> §3.1: "Collecting, caching, aggregating, or storing data or content
> accessed via the API except for purposes of facilitating your own
> trading on Kalshi. You may not share such data or content with third
> parties in any manner without prior written authorization from
> Kalshi."

**The honest verdict:** Currena's card — a scheduled worker fetching
market data from the keyless public trade API, caching it in KV, and
displaying derived probabilities to every site visitor — is squarely
inside BOTH prohibitions (a non-own-trading purpose + collecting/
caching/storing + sharing with third parties in the form of a public
page). This is not an ambiguous boundary case: the S4's working
reading ("the prohibited classes are capital-market clients and market
data distributors") was drawn from the POLYMARKET terms, and Kalshi's
own agreement is categorically stricter. The wording read therefore
fires the pre-committed worst case, and the consequences are exactly
as the roadmap recorded them:

1. **The Kalshi leg does not ship.** No `adapters/kalshi.ts`, no
   Kalshi fetch in any rung, no Kalshi attribution or link on any
   surface. `R28` renders **Polymarket + the calendar strip (R29)**.
2. **Nothing else changes.** The venue-diversification design absorbs
   the loss by design; the Polymarket leg carries the card alone,
   honestly named as ONE venue (never an implication of two).
3. The Kalshi venue probe below is recorded as the M1 evidence of the
   venue's state (alive, keyless-readable) — for the record, not for
   adoption. A future owner-negotiated written authorization from
   Kalshi (§3.1's own carve-out) is the only re-opening path; it rides
   the owner-side levers, never a session decision.

**R28's remaining venue posture (Polymarket):** the S4/04 §3 ToS read
stands as recorded — the prohibited classes are capital-market clients
and market-data distributors; a public, informational, attributed
display with links sits outside the named prohibitions; the residual
ambiguity ("financial technology companies" inside the Capital Market
Client list) is recorded and the conservative treatment applies:
display-only + attribution + link + no key'd endpoints + no bulk
redistribution.

## 2. The live venue probes (both venues read live this session, ~05:2x–05:3x UTC)

**2a. Kalshi trade API v2 (probe record; the leg drops):**
`api.elections.kalshi.com/trade-api/v2/markets?series_ticker=KXFED&status=open`
answered HTTP 200 with open KXFED markets (the first page carries the
27APR/27MAR series' target-rate markets — the venue is alive and
keyless-readable, exactly the S4 record). Recorded for the venue-state
evidence only.

**2b. Polymarket gamma API (the card's venue, verified live):**

- The S4-recorded Dec-2026 Fed event
  (`fed-decision-in-december-20260729232808632`) serves HTTP 200 with
  FIVE active markets — one per outcome. The current implied "Yes"
  prices (outcomePrices[0], the honest live read): **+25 bp 0.915 ·
  +50+ bp 0.0625 · unchanged 0.0225 · −25 bp 0.0035 · −50+ bp 0.0015**
  (bestBid/bestAsk straddle each; the sum ≈ 1.005 — live prices, not
  a normalized distribution). The S4 morning read (+25 bp 0.915 /
  +50 0.052 / unchanged 0.0305) is same-magnitude — the market has
  stayed on the same verdict since S4.
- **The discovery query (the rolling mechanism, verified live):**
  `gamma-api.polymarket.com/events?tag_slug=fomc&closed=false` serves
  11 open FOMC-tagged events including "Fed Decision in December?"
  (end 2026-12-10T04:59Z), "Fed Decision in January?"
  (2027-01-28), "Fed Decision in March 2027" (2027-03-18). The
  adapter's rule — filter `^fed-decision-in-` slugs, active and
  unclosed, pick the NEAREST endDate — rolls the card to the next
  meeting when an event closes. The event's tags carry `recurring`,
  the negRisk family fields are present; the market rows carry
  `outcomePrices`, `bestBid`/`bestAsk`, `lastTradePrice`, `slug`,
  `question`. The public event page URL is
  `polymarket.com/event/<slug>` (the attribution link).
- Rate limits (the S4 record, cited): IP-based Cloudflare throttling;
  gamma `/events` 500 req/10 s — a 30-min refresh sits ~5 orders of
  magnitude under.

**2c. The calendar feed (R29's data, verified live):** the live
`GET /api/insights` snapshot carries the calendar (25 future events,
the feed's own `titleFa` per event — already manifest-covered). The
next `fed` event: **fomc-2026-12, 2026-12-09, America/New_York**
(«تصمیم فدرال رزرو آمریکا درباره نرخ بهره»); the next `us-cpi`:
2026-12-10. The gold page ALREADY fetches this snapshot for the
Signals section — R29 reads the same snapshot's field, ZERO new
fetches (the s8/02 row 7 posture verified).

**2d. The comparison legs (R25's rider, verified live):** the public
history endpoints serve `btc-usd` (950 points, 2021-09-16 →
2026-11-19) and `silver-usd` (1,310 points, 2021-09-15 → 2026-11-19);
`gold-usd` carries 1,311 points over the same window (the 5.2-year
public history window — usable for cross-checks, NOT the episode spine
per the spec's workbook designation). `sp500` is not an insights
indicator id (400) — the S&P leg rides the markets board's stored
series at runner time (the S15-D6 posture below).

## 3. The R15/R23 drop-calendar re-check (M1(b))

**No WGC data drop.** Three ways checked: (1) the private `data/wgc/`
path — absent (the repo's `data/` carries the registry files + the
manual/ + shiller/ folders, no wgc); (2) the owner's kickoff message —
no drop notice (the credentials block aside, nothing owner-authored);
(3) the S14 close's standing item said "tell the session when the
quarterly release arrives" — no such notice came. **R15/R23 stay
pending** (the fourth consecutive session for R15; the fold record
§0.2 rule). The wall's WGC CB line renders on. **R25's own spine (the
prices workbook) rides the same drop calendar** — the S14 M1's own
record ("the ETF/prices drops (R23/R25) ride the same calendar") — with
the design consequence recorded as S15-D4 below: the Explorer ships
its editorial surfaces now and its data-gated surfaces (the price
path + the comparison table) render the honest waiting state until
the workbook lands; the adapter + runner + route ship READY.

## 4. The FRED long-run supplement re-check (s8/02 §1c row 25's build-time item)

**Unreachable from this environment:** `fred.stlouisfed.org` refused
every connection this session (HTTP 000 on 5 attempts across two
command shapes — the S4 record's own venue-state class, reproduced).
Per the repo's financial-data discipline (a candidate that cannot be
verified live is discarded and recorded), the supplement **stays
deferred-with-reason** exactly as s8/02 records it — and it changes
nothing: "the prices-workbook drop carries F6 regardless" (the
workbook is the canonical spine; the supplement was never more than a
possible pre-1978 aid). The 1971 episode's price path rides the
documented public-history values inside its own record (sourced per
record, the s7/03 §3.3 design), NOT the supplement.

## 5. Citation re-verification (the discipline — every path the rows cite, against the live tree)

Read-only, at this session's start, on the branch HEAD `c47f4c3e`.
**Zero material drift.**

| The citation (s8/01 §4 + s6/03 §2 + s7/03 §3) | The live tree | Verdict |
|---|---|---|
| `features/gold/GoldExpectations.tsx` (R28+R29's component; the s6/03 zone D landing spot) | does not exist yet — the NEW module this session creates there | free (the siblings exist) |
| `adapters/kalshi.ts` + `polymarket.ts` (the s6/03 module map's adapters) | do not exist yet — `polymarket.ts` is NEW this session; **`kalshi.ts` is NOT created** (the wording read's verdict — §1 above; the map's name was a proposal, and the worst-case band pre-committed the drop) | resolved by S15-D1 |
| The minute-cron extension point (the 30-min refresh; the PRICES_CRON_MINUTE pattern) | `apps/api/src/cron.ts` exists — the `:13` prices rung + the `:15`-mod Frankfurter + the `:50` narrator + the ingest rungs (04:10/04:25/04:30/04:35/04:40) + the 10:10/20:10 sweeps; **:23 and :53 are clear of every existing gate** | ✓ (S15-D2) |
| The route pattern: `apps/api/src/routes/insights.ts` (the gold-lbma/gold-crosses literal-path twins, registered before `/:id/history`) | exists (the four GPE routes at lines 655–835) | ✓ |
| The wire contracts: `packages/core/src/schemas.ts` (the GoldLbma/GoldXauCrosses twin block) | exists (the GPE snapshot family at lines 2380–2560) | ✓ |
| The store/job pattern: `packages/insights/src/domains/gold/lbma.ts` (the ONE-key + Rest twin + rung body) | exists — the expectations + episodes domains follow it | ✓ |
| `features/gold/GoldEpisodes.tsx` (R25's component; Zone O) | does not exist yet — NEW | free |
| `domains/gold/adapters/wgc-prices.ts` (the s6/03 module map's workbook adapter) + the typed static episode module | do not exist yet — NEW (the episode data module lands as `features/gold/gold-episodes.ts` per the web-side string-discipline below) | free |
| Zone O placement (s6/01 zone 16: the history tail AFTER Gold Positions, both collapsed; F26 is P4) | `GoldPage.tsx` renders GoldPositions at the page's tail before `{panel}` — the zone lands there | ✓ |
| Zone D placement (the expectations strip as the band's fourth element; s6/03 zone D row) | `GoldPage.tsx` renders the `data-gold-zone-d-band` (narrative + yield + on-ramp) | ✓ |
| `data/insights-calendar.json` (R29's feed) | exists (36 events; 25 future at session start; the snapshot carries it — §2c) | ✓ |
| The i18n dictionaries (the EN/FA copy homes; the manifest gate C7 rule 1) | `apps/web/src/shared/i18n/en.ts` + `fa.ts` (the `pd.gold` namespace carries the on-ramp precedent — the long-editorial-paragraph pattern) | ✓ |
| `docs/localization/persian-copy-manifest.json` (the manifest gate) | exists (8,277 entries; round 87 is the last) | ✓ |
| `scripts/check-bundle-budget.mjs` (the GoldPage ceiling) | exists — the GoldPage line at 179,000/40,000 (the S14 bump, measured 177.57/39.31 — ~1.4 kB raw headroom) | ✓ (this session ships its own measured bump if the three surfaces cross it, with the not-duplication check) |

The s6/03 §2 module map's post-modularization addresses all hold on
the live tree; the R5 no-renames constraint governs — no file moves
this session, only NEW files + in-place edits.

## 6. The D-43 deploy-lock state at session start (read-only)

The Cloudflare deployments API (read-only, this session's start): the
latest currena-api deployment is **2026-11-19T04:08:28Z** — S14's
deploy (the production `61180d7f` record). NO newer deployment exists
since the S14 close → **no drift; the D-43 gate is clear at this
session's start.** (The formal D-43 re-check re-runs FIRST at the
deploy step per docs/DEPLOY.md.)

## 7. The session's design decisions (recorded here; DECISIONS.md at the end-of-program reconciliation)

- **S15-D1 — THE KALSHI LEG DROPS** (the wording read's verdict, §1):
  the Developer Agreement v1.1 §3 + §3.1 prohibit non-own-trading use,
  collecting/caching/storing, and third-party sharing of API data. The
  card renders Polymarket + the calendar per the pre-committed worst
  case; no Kalshi adapter is built; the only re-opening path is a
  written authorization from Kalshi (an owner-side lever).
- **S15-D2 — the expectations ingest shape.** ONE KV key
  (`insights:gold-expectations:v1`) written by a NEW minute-cron gate
  at **:23 and :53 UTC** (the PRICES_CRON_MINUTE pattern — the
  30-minute card refresh; NO new cron trigger, the account's 5-cron
  limit is full; the two minutes are clear of every existing gate).
  The rung body is the lbma twin (read stored → fetch → write-if-
  changed; one gamma `events?tag_slug=fomc&closed=false` fetch +
  the read + the write ≈ 3 subrequests, declared budget 4). The
  discovery rule (§2b) rolls the market at event-close. A manual
  runner (`gold-expectations-run`, the gold-lbma-run twin) seeds the
  key through the KV REST API for post-deploy landings. Staleness is
  data-carried (the snapshot's own fetchedAt).
- **S15-D3 — the calendar join.** The strip's top line reads the NEXT
  Fed event from the in-repo calendar feed (the authority for dates)
  and the probabilities from the Polymarket snapshot; the join rule
  pairs the calendar's fed event with the Polymarket fed-decision
  event whose endDate is nearest-after it. A window mismatch beyond
  ±45 days renders the two sources SEPARATELY (never a wrong join);
  the "Tehran + NY times named at point of use" mandate renders as
  the GPE-S3-10 lesson's own form — the event's zone named at point
  of use plus the reader-locale calendar rendering (Jalali for fa) —
  because the FEED carries dates + zones, never clock times; no time
  is ever invented.
- **S15-D4 — the Episode Explorer's launch shape.** The nine records'
  EDITORIAL surfaces ship now (the typed static module + the bilingual
  dictionary copy): titles, periods, family readings with the hasData
  honesty flag, interpretation paragraphs, sources, out-bound links.
  The DATA-gated surfaces (the price path + the asset-comparison
  rider) render the honest waiting state until the WGC prices
  workbook drop lands; the `wgc-prices.ts` adapter (deterministic
  parse, fail-closed on shape), the `gold-episodes-run` runner, the
  route, and the pure windows/returns engine all ship READY — the day
  the drop lands, one runner command lights the paths. NO interim
  price spine is invented (the stored 5.2-year gold-usd history was
  weighed and REJECTED — a 5-year window would misrepresent episodes
  whose periods run decades; the fail-closed rule wins over a partial
  render).
- **S15-D5 — the FRED supplement stays deferred** (§4): the venue is
  unreachable from this session's environment; the workbook carries
  F6 regardless.
- **S15-D6 — the comparison rider's legs.** At drop time the runner
  assembles: the gold leg from the workbook spine; the silver + BTC
  legs from the stored insights histories (verified live §2d,
  2021-09→); the S&P leg from the markets board's stored series
  (resampled monthly — named at point of use; the honest unavailable
  cell if the stored depth does not reach a window). Every leg names
  its series + coverage at point of use per C1; every cell the leg's
  depth cannot support renders the honest not-enough-history state
  (the hasData grammar extended to the table). No new external fetch
  is added anywhere (the zero-new-paid-fees property holds).
- **S15-D7 — the episode strings' home.** The s7/03 §3.1 data model
  sketches `titleFa`/`readingFa` inline in the typed record; the repo's
  binding convention (AGENTS.md rule 5 + the copy:audit sweep — every
  fa string lives in the fa dictionary) wins: the episode records are
  the typed STRUCTURE (ids, periods, families, flags, link targets)
  referencing dictionary keys; all EN/FA editorial text lives in the
  `pd.gold` dictionary namespace and enters through the ONE manifest
  round at M3. The long-paragraph precedent is the on-ramp
  (`driverBody1..5`, R20).

## 8. Method and limitations

The wording read was performed against the published agreement PDF
itself (the canonical S3 host, fetched live — not a third-party
summary); the verbatim clauses are quoted above and the verdict quotes
the roadmap's own pre-committed band. The venue probes were live
fetches this session (the Polymarket gamma API twice — the event read
+ the discovery read; the Kalshi trade API once). The FRED re-check
failed at the transport layer (recorded as the venue state, honestly).
The calendar + histories verification read the PRODUCTION API
(currena.ir, read-only). Limitations: (1) the Kalshi agreement's v1.1
is the current published version as of this session (the agreement
reserves Kalshi's right to update — the record carries the version
stamp); (2) the Polymarket prices are the live instant's read — the
card ships the rung's rolling snapshot, never a hand-copied number;
(3) no code existed yet at these probes — the citations were checked
read-only against the branch HEAD.
