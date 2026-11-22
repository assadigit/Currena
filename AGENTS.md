# AGENTS.md — AURUM Desk (the Gold Intelligence & Visual Explanation programme, sandbox implementation)

This repository is the sandbox implementation of the **Gold Intelligence & Visual
Explanation (GIE)** programme: a 15-session plan building a daily gold-market
intelligence desk. The upstream programme records live in the owner's main
`Currena` repository; this repo is the standalone Next.js build that mirrors the
session arc:

- **S8 — Briefing layer (done, live):** six LLM-written narrative sections
  (exec / macro / price-action / positioning / news / outlook), the market
  strip, the bias meter, the scenario set, and the news tape. Served by
  `/api/desk` with SQLite caching per date.
- **S9 — Supporting-Visuals layer (done, live):** eight explainable visuals
  (V1 price 180d · V2 driver attribution · V3 correlation matrix · V4
  volatility regime · V5 positioning & flows · V6 sentiment timeline · V7
  scenario fan · V8 seasonality), each shipping an insight-first title, a
  data-driven current reading, and a collapsible how-to-read guide.
- **S10 — Roots layer (done, live):** the desk is grounded in real market
  data via the owner-supplied EODHD API, with honest provenance and a
  fail-closed synthetic fallback — the desk never goes dark.
- **S11 — Continuity layer (done, live):** the desk has memory — a
  track-record band over the cached DeskDay archive (bias history
  sparkline + scenario-vs-realized strip) and a "then vs now" line on
  date navigation, all read back from what the desk already persists.
- **S12 — Calibration layer (done, live):** the desk's honesty is
  measurable — a rolling scorecard band over the cached archive
  (bias-direction hit rate, base-case accuracy, probability
  calibration), every number stating its sample size and its era,
  served read-only by `/api/desk/calibration`.
- **S13 — Watch layer (done, live):** the owner pins the desk to the
  questions they actually care about — owner-defined watch rules
  (price-level breaks, bias flips, scenario-band breaches, calibration
  thresholds), evaluated server-side at read time over what the desk
  already persists. Rules live in SQLite (`WatchRule`), CRUD rides
  `/api/desk/watch` with toast feedback, the watch band re-checks on
  every desk load, and the once-per-day EODHD sync stays the only
  network surface. Every watch is an observation, never advice.
- **S14 — Digest layer (done, live):** the whole day in one glance — a
  compact digest band at the top of the desk that ties the latest
  briefing headline and market snapshot, the fired S13 watch triggers
  (quoted verbatim, with their eras and samples), the S12 scorecard
  verdicts (each stating its n) and the S11 live-era memory into a
  single honest morning read. Assembled server-side from what the
  desk already persists (`/api/desk/digest`, read-only, zero new
  network), and exportable as a self-contained print-friendly sheet
  (the Print digest button isolates the same payload via print CSS —
  no new fetches, no images, no new dependencies). Every number
  states whether it comes from live or modelled desk days and its
  sample size where a rate is involved; the digest is an observation,
  never advice.
- **S15 — next session (the programme close-out).**

## Architecture (the one page a session must know)

```
src/lib/gold/engine.ts     deterministic market engine (seeded per date) → EngineFacts
                           S10 seam: computeMarket(date, override?) — live series
                           replace the generated ones wholesale; every derivation
                           (MA/RSI/vol/correlations/returns/scenarios) stays in the
                           same code paths, so the briefing and visuals render
                           byte-comparable; without an override the output is
                           bit-identical to the deterministic engine
src/lib/gold/sources/eodhd.ts  S10 Roots: the EODHD adapter — symbol registry
                           (recorded by live probe), thin client, once-per-day
                           trailing-window sync, ICE DXY computed from component
                           pairs, grounded-bundle builder (intersection grid,
                           staleness + depth gates)
src/lib/gold/grounded.ts   S10 Roots: grounding resolution (grounded vs
                           fail-closed fallback with honest reason) + provenance
                           assembly; builds through the same builder paths
src/lib/gold/builder.ts    facts → BriefingPayload + VisualsPayload (S8 + S9)
src/lib/gold/narrative.ts  z-ai-web-dev-sdk strategist model rewrites the six
                            sections; deterministic template fallback
src/lib/gold/continuity.ts S11 Continuity: the desk archive — read-only
                            queries over cached DeskDay rows (bias, scenario
                            calls, narrative highlights, dataMode) plus the
                            Observation store (realized gold closes); the
                            scenario-vs-realized and then-vs-now math.
                            Modelled-era days are labelled and never mixed
                            into realized math; no scraping, no rebuilds
src/lib/gold/calibration.ts S12 Calibration: the desk scorecard —
                            read-only grading of the cached archive
                            against the observation store. Bias-direction
                            hit rate (stance sign vs the next observed
                            move; flat/neutral days excluded and counted),
                            base-case accuracy (|realized − base target|
                            percent, graded to-date against the latest
                            close), and probability calibration (the
                            highest-probability scenario vs how often it
                            proved closest, in fixed stated-probability
                            bands). Every score states its n; realized
                            math pools live-era days only
src/lib/gold/watch.ts       S13 Watch: the rule engine — owner-defined
                            rules (price-level breaks, bias flips,
                            scenario-band breaches, calibration
                            thresholds) evaluated at read time over the
                            same stores S11/S12 read (DeskDay cache,
                            observation store, S12 scorecard). Every
                            trigger states the fact, its date, its era
                            and its sample; gaps (no observations, no
                            live desk day, no graded days) are stated,
                            never faked quiet. Zero new network
src/lib/gold/digest.ts       S14 Digest: the morning read — server-side
                            assembly of the whole day in one glance
                            from the layers the desk already has: the
                            viewed desk day's own briefing headline +
                            snapshot + scenario calls + provenance
                            (cached DeskDay row), the fired S13 watch
                            triggers (quoted verbatim with eras and
                            samples), the three S12 scorecard verdicts
                            (each with its n and the sub-ten verdict
                            cap), and the S11 archive compressed into a
                            live-era then-vs-now memory. Read-only,
                            cache-first, zero new network; never
                            triggers a build
src/app/api/desk/route.ts  GET ?date=&force=&source=auto|modelled (cache-first,
                           stamps on the latest available trading day) ·
                           POST {date} (regenerate: re-pull + rebuild)
src/app/api/desk/continuity/route.ts  S11: GET ?date=&from=&to= — the
                           track-record archive (read-only)
src/app/api/desk/calibration/route.ts  S12: GET ?date= — the scorecard
                           (read-only; never triggers a build — the
                           deterministic engine stays reachable via
                           /api/desk?source=modelled)
src/app/api/desk/watch/route.ts  S13: GET ?date= (evaluate every rule,
                           read-only) · POST/PATCH/DELETE (rule CRUD;
                           validation mirrors the engine so a persisted
                           rule is always evaluable)
src/app/api/desk/digest/route.ts  S14: GET ?date= — the morning read
                           (read-only; assembles from the cache + the
                           S13/S12/S11 builders; never triggers a build,
                           never calls the network)
db/custom.db (Prisma)      DeskDay rows (briefing/visuals JSON + dataMode +
                           provenanceJson) · Observation rows (one per
                           dataset-date) · SourceSync rows (per-dataset source
                           registry state) · WatchRule rows (S13: one per
                           owner rule — scalar columns only)
src/app/page.tsx            the desk page — the digest band on top, then
                           sections paired with their visuals
src/components/gold/        header · market-strip (with the "data as of"
                           provenance line) · section-nav · briefing-card ·
                           bias-meter · footer (full provenance note) ·
                           track-record + then-vs-now (the S11 band) ·
                           calibration (the S12 scorecard band) ·
                           watch-band (the S13 rules + rule editor) ·
                           digest (the S14 morning-read band + the print
                           sheet — one payload, two renditions) ·
                           visuals/* (the eight V-cards)
```

## The S11 continuity surfaces (what the desk remembers)

The track-record band sits under the briefing masthead: a bias-history
sparkline across every cached desk day (modelled days dotted in, the
viewed day outlined) and a scenario-vs-realized strip — each past desk
day's bull/base/bear probability-target chips against gold's actually
observed close since. The "then vs now" line rides with date
navigation: on a cached day it states what the desk said then, what
gold did since (live-era days only), and what the desk believes on its
latest day. Both are served by `/api/desk/continuity` from what the
desk already persists — no new scraping. Every number states its era:
realized comparisons are drawn only for live/mixed desk days with
observed closes beyond them; modelled-era days (pre-S10 rows and
fallback builds) are labelled and kept for the record, never silently
mixed with the live-era record.

## The S12 calibration surfaces (how the desk is scored)

The scorecard band sits under the S11 track record: three compact score
cards — bias-direction hit rate (the sign of the desk's stance versus
gold's next observed move; flat repeats and neutral stances are excluded
and counted, never folded into the rate), base-case accuracy (|realized
close − base target| in percent, graded to-date against the latest
observed close because the targets carry a 90-day horizon), and
probability calibration (the day's highest-probability scenario is its
favourite — a tied top means no favourite — and the check asks how often
favourites at each stated level won). Stated-probability bands render
with their zero samples when empty, a per-day grade table states every
day's era and exclusions, and the current reading names the anchor close
and the record composition. Realized math pools live-era desk days
only; modelled-era days stay in the record, labelled, never graded.
Below roughly ten resolved days the band refuses to call its numbers a
verdict. Served by `/api/desk/calibration` from what the desk already
caches — no new scraping, no rebuilds, and the route never triggers a
build.

## The S13 watch surfaces (the owner's pinned questions)

The watch band sits under the S12 scorecard: one row per owner rule,
triggered rows first, each stating the fact, the date it last held, its
era (live desk days only for anything touching realized prices;
modelled-era evidence is labelled and never pooled), and its sample
size where a rate is involved. Four rule families are evaluated
server-side at read time: price-level breaks (gold's latest observed
close crossing an owner-set level, judged against the two latest
observed trading days), bias flips (the published stance changing sign
or crossing a threshold, read back from the desk cache), scenario-band
breaches (the latest base-case target or its implied move crossing a
level), and calibration threshold breaches (the rolling mean base-case
miss or the direction hit rate versus a threshold — the exact S12
scorecard numbers, sample size stated). Rules persist in SQLite via
Prisma (one row per rule, scalar columns only); CRUD is API-route-
reachable (`/api/desk/watch` POST/PATCH/DELETE) with toast feedback and
validation that mirrors the engine, so a persisted rule is always
evaluable. The band re-checks on every desk load and adds no polling —
the once-per-day EODHD sync stays the only network surface. Every watch
is an observation, never advice; there is no push/notification
infrastructure (in-desk surfaces only), and the deterministic engine
stays reachable via `GET /api/desk?source=modelled`.

## The S14 digest surfaces (the morning read)

The digest band sits at the very top of the desk, above the market
strip: one card that answers "what happened and what do I care about"
before anything else renders. It carries an insight-first title (fired
watches first, else the day's own exec headline), a one-glance numbers
line (spot, day change, bias, base case), and four labelled rows: **The
day** (the viewed desk day's own lead with its era, narrative source,
as-of stamp, live-series count and honest stamp note), **Watches** (the
fired S13 triggers quoted verbatim with their era/n/as-of chips, quiet
and paused rules summarised by count), **Scorecard** (the three S12
verdicts, each stating its n, with the sub-ten "descriptive record, not
a verdict" cap and the live-era-only note), and **Memory** (the S11
live era compressed: first live desk day → latest, realized move,
stance shift, base-target drift, with modelled days counted, labelled,
never pooled). A current-reading block names the anchor close and the
record composition; the collapsible guide explains every honesty rule.
**Print digest** exports the same payload as a self-contained
print-friendly sheet: the button adds `body.digest-printing` around
`window.print()` and print CSS isolates the sheet (a plain, theme-free
ink-on-white document) — no new fetch, no images, and a normal Ctrl+P
still prints the page as-is. Served read-only by `/api/desk/digest`
from the cache + the S11/S12/S13 builders; it adds no polling and never
triggers a build — the once-per-day EODHD sync stays the only network
surface, and the deterministic engine stays reachable via
`GET /api/desk?source=modelled`.

## The S10 data sources (recorded by live probe; EODHD plans gate symbols)

| Series | Source | Mode |
| --- | --- | --- |
| Gold spot (XAU/USD) | `XAUUSD.FOREX` | live |
| Silver spot (XAG/USD) | `XAGUSD.FOREX` | live |
| US Dollar Index | ICE DXY formula from the six component FX pairs | live |
| S&P 500 | `SPY.US` (index not on the plan; ETF closes, % moves) | live-proxy |
| 10Y real yield | `^TNX.US` (no TIPS series on the plan; nominal proxy) | live-proxy |
| WTI crude | `USO.US` (futures-roll proxy; correlations only) | live-proxy |
| Net specs / ETF flows / news tape & sentiment | no EODHD source — modelled | modelled |

History is capped at ~1 trailing year per symbol on this subscription, so the
grounded window is ~250 trading days; dates with fewer than 200 live days
(e.g. beyond the window) honestly fall back to the deterministic engine, and
every provenance line states exactly which series are live versus modelled.

Rules that bind every session:

1. **The engine is deterministic per date** — the same date (and data mode)
   always produces the same facts. Regeneration re-pulls live observations,
   rebuilds the facts, and re-runs the strategist narrative.
2. **The narrative is model-written, template-fallback** — `narrativeSource`
   records which one served. The desk must never render without a narrative.
3. **The LLM runs server-side only** (`z-ai-web-dev-sdk` in
   `/api/desk`-reachable modules; never in client components).
4. **Every visual explains itself** — insight-first title, current reading,
   reading guide. Charts are Recharts via the shadcn `ChartContainer` (the
   correlation matrix is hand-built CSS grid).
5. **No secrets in the repo.** Session credentials (GitHub push token, EODHD
   key, Cloudflare tokens) arrive in chat at session start/close, are used
   env-only (`.env.local` is gitignored) or inline, and are never stored or
   printed.
6. **Stack discipline:** Next.js 16 App Router · TypeScript · Tailwind 4 ·
   shadcn/ui (New York) · Prisma/SQLite · TanStack Query · Recharts. Use the
   existing components; no new charting/UI dependency without cause.
7. **Accessibility floor:** semantic landmarks, ARIA labels, 44px touch
   targets, the sticky-footer layout (`min-h-screen flex flex-col` +
   `mt-auto`), light/dark mode via next-themes.
8. **Fail-closed data grounding (S10):** any EODHD failure, stale window or
   shallow history falls back to the deterministic engine with the fallback
   recorded in provenance. The engine stays reachable directly via
   `GET /api/desk?source=modelled`. Desk rows built before S10 (null
   provenance) are cache misses and rebuild grounded.
9. **Honest track record (S11):** the archive reads only what the desk
   already persists (DeskDay cache + Observation store). Modelled-era
   desk days are labelled and never enter realized-outcome math; every
   continuity number states whether it comes from live or modelled desk
   days. The S8/S9/S10 payload contracts and visual bindings render
   unchanged apart from the new Continuity elements.
10. **Measurable honesty (S12):** the scorecard grades only what the desk
   published (bias sign, base-case target, stated probabilities)
   against the live observation store, and every calibration number
   states its sample size and its era — live desk days only for
   realized math, modelled days labelled and never pooled. Flat,
   neutral, in-flight and tied-favourite days are excluded and counted,
   never silently folded into a rate. Small samples stay small on the
   surface: below roughly ten resolved days the scorecard is a
   descriptive record, not a verdict. The deterministic engine stays
   reachable via `GET /api/desk?source=modelled`.
11. **Owner-pinned watches (S13):** watch rules are observations, never
   advice — every trigger states the fact, the date it last held, its
   era and its sample size where a rate is involved. Realized-price
   evidence pools live-era desk days only; modelled-era data may inform
   the record but is labelled and never pooled. Rules that cannot be
   evaluated yet state their gap honestly instead of rendering a fake
   quiet state. Evaluation adds no polling or network surface: the
   watch band re-checks on every desk load over the persisted record,
   the once-per-day EODHD sync stays the only network call, and no
   push/notification infrastructure exists (in-desk surfaces only).
   The deterministic engine stays reachable via
   `GET /api/desk?source=modelled`. The S8–S12 payload contracts and
   visual bindings render unchanged apart from the new Watch elements.
12. **The honest digest (S14):** the digest is an observation, never
   advice — it ties what the desk said, what its rules found, how it
   has scored and what it remembers into one morning read. It is
   assembled server-side, read-only, from what the desk already
   persists (the briefing cache, the S13 evaluation, the S12 scorecard
   and the S11 archive); it adds no polling and no network surface,
   and it never triggers a build (a desk with no cached day states
   its gap honestly). Fired triggers are quoted verbatim; every
   number states whether it comes from live or modelled desk days and
   its sample size where a rate is involved (the verdict cap below
   ten resolved days is enforced server-side). When an older day is
   viewed, the day and scenario rows show that day's own calls while
   the watch, scorecard and memory rows honestly read the whole
   rolling record. The export view renders the same payload — no
   second data path. The S8–S13 payload contracts and visual
   bindings render unchanged apart from the new Digest elements.

## The session close-out protocol (what every session ends with)

1. `bun run lint` green; the dev server (port 3000) healthy — check the tail
   of `dev.log`.
2. Browser-verify the golden path with agent-browser (render, the eight
   visuals, date navigation, regenerate + toast, collapsible guides, dark
   mode, mobile 375px) — "it compiles" is never sufficient.
3. Commit the session's work (the harness auto-commits too; commit messages
   name the session and the change).
4. Push to the Currena repository on a **session branch** (never force
   `main` — it carries the upstream programme history):
   `git push https://<token>@github.com/assadigit/Currena.git HEAD:refs/heads/feat/<name>`
5. Hand the owner the TLDR + the next session's copy-paste prompt.

## Owner preview

The desk is previewed through the sandbox **Preview Panel** (the "Open in New
Tab" button), never via local URLs. The sandbox port is fixed at 3000.
