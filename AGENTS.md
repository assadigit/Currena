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
- **S15 — Close-out (done, 2026-11-22): the programme complete.** A
  full-stack verification walk over every shipped layer (the record is
  the "S15 close-out record" section below), a check that every binding
  rule still holds on the live build, and the final record state. No
  new features, no schema changes, no new dependencies.

**Programme counter: Session 15/15 · 0 remaining — the programme complete.**

- **Deployment addendum (2026-11-22, after S15):** per the owner's
  instruction the completed desk was ported to run on the owner's
  **Currena Cloudflare Worker** (OpenNext for Cloudflare + Prisma over
  Cloudflare D1) with the sandbox desk of record unchanged in behaviour —
  see the "Currena Worker deployment" section below for the port, the
  workerd verification record, and the honest limits.

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

## The S15 close-out record (2026-11-22)

The close-out proved the finished desk end to end on the live build
(over the restored S14 tree, `feat/gie-s14-digest-layer` @ `4d87c9c`)
and left the record in its final state. Everything below was exercised
live in this session: agent-browser over the golden path plus
API-level checks against the running server on port 3000. Zero
console errors across the whole walk.

**The verification walk (all exercised live):**

- **The full surface stack renders**: the digest band on top → market
  strip (with the "data as of" provenance line) → section nav →
  then-vs-now line → track-record band → scorecard band → watch band →
  the six briefing sections with their eight visuals → the footer; the
  print sheet hidden on screen (`display: none`).
- **The eight S9 visuals** each render their insight-first title,
  current reading and collapsible how-to-read guide; the guide toggle
  was exercised open → closed → open (the numbered list renders only
  while open).
- **Date navigation**: prev-day walked Sun 22 Nov → Sat 21 Nov → Fri 20
  Nov → Thu 19 Nov (the weekend steps honestly re-stamp on Fri 20
  Nov), then next-day back. The then-vs-now line reads the viewed day
  ("on Thu 19 Nov the desk called bias -58 at $3,607 — gold has fallen
  -1.94% to $3,537 since…"); the digest's day/scenario rows show the
  viewed day's own calls while the watch/scorecard/memory rows read
  the whole record.
- **Regenerate + toast**: POST `/api/desk` re-pulled the EODHD
  observation store once (all SourceSync rows re-stamped at a single
  timestamp), rebuilt the 2026-11-20 desk day with a fresh strategist
  narrative, and left the archive structurally intact (6 desk days:
  4 live + 2 modelled; 5 watch rules). The "Briefing regenerated"
  toast fired; the post-regenerate state was re-verified (cross-check
  and watch states below).
- **Watch-rule CRUD + toasts through the UI**: a rule added ("Watch
  rule added" toast, rendered and evaluated honestly), deleted
  ("Watch rule deleted"), and a real rule paused/resumed ("Watch rule
  paused" / "Watch rule resumed") — the persisted record restored to
  the 5 original active rules at the end. The same cycle was verified
  at the API level (POST/PATCH/DELETE), and both 400 validation paths
  (bad kind, bad level) reject.
- **The digest + its print view**: the four labelled rows render with
  the current-reading block and collapsible guide; **Print digest**
  fired `window.print()` with `body.digest-printing` applied, and a
  PDF rendered under print media contained ONLY the digest sheet
  (title + the four rows; no briefing section, no chart axes leaked)
  — the same payload, ink-on-white, no new fetch.
- **Dark mode**: light → dark → light toggled; the root class flips
  and the desk renders in both.
- **Mobile 375px**: no horizontal overflow (scrollWidth = 375), the
  digest renders its four rows, the footer is pushed down naturally
  (footer bottom = scroll height).

**The digest numbers cross-checked against the raw DB — twice.** An
independent recomputation over the DeskDay / Observation / WatchRule
rows matched the served digest exactly: **66/66 checks before the
regenerate, 58/58 after** (the post-regenerate record quotes fewer
triggered rules because the re-pulled closes moved two of them to
quiet — honest re-evaluation, not drift). The re-grade reproduced the
S12 math per day (including the flat repeat on 2026-11-20 → 2026-11-21
and the modelled-era exclusions), the memory block recomputed from the
raw rows (live era 2026-11-17 → 2026-11-20, realized −8.13% pre / −8.10%
post against the anchor close), and the quoted watch statements are
byte-verbatim from the watch evaluation.

**Every binding rule, confirmed against the live build:**

1. **Deterministic engine reachable via the force flag** — verified:
   `GET /api/desk?source=modelled` serves a fresh modelled build
   (dataMode "modelled", fallbackReason "forced via the
   source=modelled flag — deterministic engine output"), never
   cached, never written to the archive.
2. **No secrets in any artifact** — verified: a scan over all 126
   tracked files, the SQLite archive, and every served payload found
   no token or key strings; the EODHD token is env-only
   (`.env.local`, gitignored, never printed).
3. **Once-per-day EODHD sync the only network surface** — verified:
   every read route skipped the network on an already-synced day
   (SourceSync rows unchanged through dozens of reads); the only
   re-pull was the desk's own regenerate path; the
   digest/continuity/calibration/watch routes never trigger a build.
   Edge dates: weekends/holidays stamp on the latest trading day with
   the honest stampNote; a pre-window date (2025-06-02) serves its
   cached modelled-era row with its fallbackReason; invalid dates
   return 400.
4. **Payload contracts intact** — verified: the S8 briefing (six
   sections, news tape, scenario set), the S9 visuals payload (the
   eight visuals + the guides/insights/takeaways collections), the
   S10 provenance (dataMode, asOf, stampNote, per-dataset
   live/modelled lines) all serve the contracted shapes on every
   route checked.
5. **Sticky footer + 44px targets + dark mode** — verified with one
   honest deviation: the footer pushes down naturally at desktop and
   375px and the `min-h-screen flex-col` + `flex-1` mechanism is in
   the code; primary touch targets meet 44px (Regenerate h-11, the
   dark-mode toggle 44×44, Print digest 128×44); secondary controls
   sit below it unchanged since S8 (date steppers 36px, collapsible
   triggers 32px tall, "What is" info buttons 16px, "Show supporting
   visual" buttons 28px) — recorded as a known deviation, NOT
   redesigned in the close-out (fixing ~36 controls is a redesign,
   out of the close-out's scope).

**Honestly not verified (stated as such):**

- The content-shorter-than-viewport sticky-footer branch was not seen
  live: the desk always renders more than a viewport of content, and
  the browser-level request abort did not intercept the local fetches
  (the error state could not be forced). The mechanism is verified in
  the code and the push behavior verified live.
- No live EODHD outage was re-induced this session (the S10
  fail-closed path was exercised in S10–S14). The modelled-era cached
  row and the force-flag path serve honestly, but a fresh outage was
  not simulated.
- The print sheet was verified as a PDF rendered from print media
  with the class active; no physical printer driver was involved
  (it is a browser print path, as designed).

**The final record state:** the archive DB (`db/custom.db`) holds 6
desk days (4 live-era + 2 modelled, all `narrativeSource "llm"`),
the full observation store (gold/silver/spx/realYield/oil/dxy + the
six DXY component pairs, ~1 trailing year per symbol), the 5 owner
watch rules (all active), and the SourceSync registry. The
2026-11-20 desk day is the one regenerated during the close-out
verification — through the desk's own regenerate path, so its numbers
and two watch-rule states ("Gold reclaims $3,535", "Base case targets
at least $3,590") honestly moved with the re-pulled closes. The
desk's next sync fires on the next UTC day (or the next regenerate).

## The Currena Worker deployment (addendum — 2026-11-22, after S15)

Per the owner's instruction ("I want it deployed on the Currena's worker"),
the completed desk was ported to the owner's Cloudflare Worker after the
S15 close-out. The sandbox desk of record is unchanged in behaviour; the
Worker is a second runtime for the same code, and it was verified the same
way — route by route, browser-verified, with every deviation stated.

**The port (only what had to change):**

- **Next.js 16.1.3 → 16.4.6** (eslint-config-next to match): the supported
  range of `@opennextjs/cloudflare` 1.20.18 (the OpenNext Cloudflare
  adapter). The desk was re-walked after the bump on both runtimes.
- **prisma/schema.prisma:** `previewFeatures = ["driverAdapters"]` — adds
  the adapter option; the sandbox engine path is untouched (Prisma requires
  the normally-generated client for the adapter option to be valid at all).
- **src/lib/db.ts — the deployment seam.** On the Worker the client is
  constructed with the `PrismaD1` driver adapter over the D1 binding,
  resolved through OpenNext's request context (the stable
  `Symbol.for("__cloudflare-context__")` property its worker entry installs
  per request — the same contract the adapter's public
  `getCloudflareContext()` reads). It is exported as a chainable lazy proxy
  so every `db.<model>.<method>(…)` call site in every layer is untouched.
  One Worker-only normalisation lives in this file, documented inline:
  a **bind-parameter shim** — `@prisma/adapter-d1` 6.19.2 serialises
  DateTime parameters to TEXT (`2026-…+00:00`, in its `mapArg`) while
  the engine-generated reader expects the engine's storage convention
     (millis-since-epoch INTEGER — how `db/custom.db` and the D1 seed store
     every DateTime); an un-normalised Worker write makes that row
     unreadable on its next request (P2023). The shim converts both raw
     Dates and the adapter's datetime-text params to millis at the bind
     boundary, keeping Worker writes byte-compatible with the seed and
     with Prisma's own reads (verified: create → read-back → evaluate).
- **src/lib/gold/narrative.ts:** the `z-ai-web-dev-sdk` import became a
  guarded dynamic import inside the model call (inside the existing
  retry/fallback guard). On the Worker the sandbox-internal model gateway
  cannot load (it reads a local config file via `fs`); the guard catches,
  and the desk serves the deterministic template narrative — the designed
  fail-closed path, with `narrativeSource` recording which one served. In
  the sandbox the behaviour is unchanged (regenerate verified:
  `narrativeSource: "llm"`).
- **src/app/layout.tsx:** a one-line identity shim for esbuild's `__name`
  helper — OpenNext's keep-names bundling leaves a `__name(…)` call inside
  next-themes' pre-hydration inline script without its definition, so the
  script died before applying the saved theme (a flash of the wrong theme
  plus a page error). With the shim defined first, the script runs to
  completion — zero page errors on reload (verified). A no-op in the
  sandbox.
- **eslint.config.mjs:** the new `react-hooks/set-state-in-effect` rule
  (shipped with eslint-config-next 16.4) pinned off — the four places it
  flags are intentional mount effects in shipped S8–S14 code (the
  hydration-safe date init, the next-themes mounted guard, the shadcn
  carousel), kept verbatim per the payload-contract rules.
- **New files:** `wrangler.jsonc` (worker `currena-gold-desk`; D1 binding
  `DB` → database `aurum-desk`; nodejs_compat; assets + self-reference
  bindings), `open-next.config.ts`, `scripts/d1-dump.ts`, the `worker:*`
  package scripts, and `.gitignore` entries (`.open-next/`, `.wrangler/`,
  `.dev.vars`, `db/d1-dump.sql`). Dependencies added:
  `@opennextjs/cloudflare`, `wrangler` (dev), `@prisma/adapter-d1@6.19.2`
  (matches the installed Prisma 6.19.2 exactly).

**The D1 seed:** `scripts/d1-dump.ts` reads `db/custom.db` strictly
read-only and emits SQL through SQLite's own `quote()` (no JavaScript
re-encoding of any value; ordered by primary key). 3474 rows — 6 DeskDay,
3457 Observation, 6 SourceSync, 5 WatchRule — matching the S15 record
counts exactly.

**Verified on local workerd (`wrangler dev`, port 8788, seeded local D1):**

- Every route: `/api/desk` (the cached archive row served from D1 with the
  identical numbers; the fresh build; the `source=modelled` force flag; the
  invalid-date 400), `/api/desk/continuity`, `/api/desk/calibration`,
  `/api/desk/watch`, `/api/desk/digest`.
- `POST /api/desk` regenerate — the full living-desk cycle on the Worker:
  the EODHD re-pull through workerd (`dataMode: live`), the rebuild, the
  honest template narrative (the LLM unreachable, the fallback log line
  stating it), the D1 writes, and the read-back of every route after the
  rewrite.
- Watch CRUD end-to-end: create (201) → the new rule evaluates in the watch
  band → PATCH toggle → DELETE; the five recorded rules restored after.
- The browser golden path on the worker: the page render with the digest
  band, the six briefing sections, the eight visuals (7 Recharts SVGs +
  the CSS-grid correlation matrix), date navigation with the then-vs-now
  line, the Regenerate button (POST 200s), dark mode, 375px mobile with no
  horizontal overflow, the print sheet rendered as a PDF — and zero page
  errors on reload after the `__name` shim.
- The sandbox after the port: the dev server (port 3000) re-walked — every
  route, the LLM narrative regenerate (`narrativeSource: "llm"`), lint
  green, dev.log clean.

**Honestly stated limits:**

- The Worker's D1 is a **copy** of the archive, seeded once at deploy; the
  two stores continue independently (the sandbox `db/custom.db` stays the
  desk of record; the Worker's own regenerate path updates its D1 going
  forward). The seed's DeskDay row counts and the S15 record match at
  hand-over.
- New Worker-built days carry **template narratives** — the strategist LLM
  is a sandbox-internal service (`/etc/.z-ai-config` → an
  `internal-api.z.ai` endpoint, unreachable from Cloudflare); the archive's
  LLM-written days still render as cached rows on the Worker.
- Workers on the **free plan** have tight CPU budgets; a regenerate is a
  few seconds of work — if the account is on the free plan the first
  full-sync request may hit the CPU limit (upgrade the worker to the
  Standard plan if that appears).
- A benign esbuild warning survives in the worker bundle (a duplicate
  object key in the S13 watch code — pre-existing in the shipped source,
  later key wins at runtime; untouched per the payload-contract rules).
- The pushed branch leaves `db/custom.db` at its S15-record state: the
  binary could not be carried through this session's GitHub tooling. The
  sandbox copy locally carries the port-verification regenerate of
  2026-11-20 (through the desk's own regenerate path — the precedented
  close-out pattern), and the deployed D1 was seeded from that same state,
  so the record survives in two places: the S15 archive on `main` and the
  Worker's D1.
- The **remote deploy ran on 2026-11-22** — the owner supplied the
  Cloudflare API token + account ID in chat (used env-only, never stored
  or printed, per binding rule 5) and the procedure below was executed
  verbatim against the live account; the live URL and the live
  verification record are in "The remote deploy run" section below.

**The deploy procedure (for the record; credentials env-only):**

```
bun run worker:build                                    # OpenNext bundle
wrangler d1 create aurum-desk                          # paste database_id into wrangler.jsonc
bun run worker:dump                                     # db/d1-dump.sql (gitignored)
wrangler d1 execute aurum-desk --remote --file=db/d1-dump.sql
printf '%s' "$EODHD_TOKEN" | wrangler secret put EODHD_TOKEN   # value from .env.local, never printed
bun run worker:deploy                                   # → currena-gold-desk.<account>.workers.dev
```

### The remote deploy run (2026-11-22)

The owner supplied the Cloudflare API token + account ID in chat (used
env-only, never stored or printed, per binding rule 5). The procedure above
was then executed verbatim against the live account:

- **`wrangler d1 create aurum-desk`** → database
  `264617a4-5bfa-43af-8c9c-d4c95d257dc8` (region APAC); the UUID was
  patched into `wrangler.jsonc` by the deploy run, as the placeholder
  comment documented.
- **`bun run worker:dump`** → the seed regenerated from the unchanged
  archive: 3474 rows (6 DeskDay / 3457 Observation / 6 SourceSync /
  5 WatchRule) — the S15 record counts exactly.
- **`wrangler d1 execute aurum-desk --remote`** → 3474 changes across the
  4 tables; the archive seeded byte-exact.
- **`wrangler secret put EODHD_TOKEN`** → attached from `.env.local`
  through stdin, never printed; the name-only listing
  (`wrangler secret list`) confirms it.
- **`wrangler deploy`** → the verified `.open-next` bundle (built from
  this exact tree at the port commit) deployed as worker
  **`currena-gold-desk`** on the account's workers.dev subdomain:

  **https://currena-gold-desk.sedanama-ir.workers.dev**

  The account's existing `currena-api` worker (an unrelated live service)
  was checked and left untouched.

**Verified against the live URL:**

- Every route 200: `/api/desk` (the cached archive row,
  `narrativeSource: "llm"` — the LLM-written days render from D1),
  `/api/desk/continuity`, `/api/desk/calibration`, `/api/desk/watch`,
  `/api/desk/digest`; the invalid date 400s; the pre-window date
  (2025-06-02) serves its cached modelled-era row.
- **The force flag on the Worker**: `GET /api/desk?source=modelled`
  serves dataMode "modelled" with fallbackReason "forced via the
  source=modelled flag — deterministic engine output" — and the next
  cached read is byte-identical (the forced build writes nothing, as
  designed).
- **The archive serves byte-for-byte**: the live
  `/api/desk?date=2026-11-22` response is `cmp`-identical to the sandbox
  dev server's — the D1 seed round-tripped the archive exactly.
- **The write path on real remote D1** — a full watch-rule cycle: create
  (201) → read-back (the new rule evaluates in the live watch band) →
  PATCH pause → read-after-write (the DateTime bind shim holds on the
  remote D1 — no P2023) → DELETE → net-zero (the five original rules
  intact, the label set byte-identical to the pre-cycle state).
- **The browser golden path** (agent-browser against the live URL, zero
  console and zero page errors across the whole walk): the full surface
  stack renders (digest band → market strip → section nav → then-vs-now →
  track record → scorecard → watch band → the six briefing sections with
  the eight visuals → the footer); the digest guide toggles open/closed;
  **Print digest** fired `window.print()` with `body.digest-printing`
  active at invocation (the class self-cleans after the print path); date
  navigation stepped Sun 22 → Sat 21 → Fri 20 → Thu 19 (the weekend steps
  re-stamp honestly; the Thu 19 Nov then-vs-now line reads "on Thu 19 Nov
  the desk called bias -58 at $3,607 — gold has fallen -2.06% to $3,533
  since…") and returned to today; dark mode light → dark → light; 375px
  mobile with no horizontal overflow (scrollWidth 375), the four digest
  rows rendered, and the footer pushed down naturally (footer bottom =
  scroll height).
- **No secrets in any artifact**: a scan over every live payload (the
  desk, continuity, calibration, watch, digest, the modelled build and
  the HTML page) found no token or key strings.

**Honestly not fired on the live Worker:**

- **POST /api/desk (regenerate)** was not fired against the live D1: it
  would permanently replace the seeded LLM-written 2026-11-20 desk day
  with a template-written one (the designed Worker fallback — the
  strategist LLM is sandbox-internal). The write path is proven twice
  over instead: the full regenerate cycle on local workerd (above) and
  the watch CRUD write cycle on the live remote D1 (above). The
  once-per-day EODHD sync fires on the next UTC day through the same
  code, with the `EODHD_TOKEN` secret attached; if the account is on the
  Workers free plan, that first sync may hit the CPU budget (the limit
  note above).
- Watch CRUD through the *UI* was not re-fired live — the API-level
  cycle above is the same code path the UI buttons drive, and the UI CRUD
  was browser-verified on local workerd.

### The currena.ir/gold routing (2026-11-22, later the same day)

The owner's clarification after the first remote deploy — "We supposed to
upgrade currena.ir/gold" — set the deployment's real target: the desk
belongs at **currena.ir/gold**, the Currena site's gold page, not on a
standalone workers.dev URL. ("AURUM Desk" is the programme record's
internal codename for this gold desk; the page itself is the Currena
gold-page upgrade.) What was found on the account, what changed, and what
was verified:

**The site's architecture (as found):** the `currena.ir` zone lives on
the same account; the whole site — the Currena Currency Converter — is
served by the owner's existing `currena-api` worker through a Workers
**custom domain** on `currena.ir` (no Pages projects; no pre-existing
zone routes). Before this change, `currena.ir/gold` simply fell through
to the converter shell.

**The change (two pieces, both recorded in the repo):**

- **Path-prefix build** — the worker build now runs with
  `NEXT_PUBLIC_BASE_PATH=/gold`: `next.config.ts` picks it up as Next.js
  `basePath` (every route, asset link and RSC fetch moves under `/gold`),
  and the seven client-side `fetch()` call sites (six in
  `src/app/page.tsx`, three in `src/components/gold/watch-band.tsx`)
  carry the new `deskBasePath` constant from `src/lib/utils.ts` — raw
  fetch paths are not rewritten by basePath the way next/link URLs are.
  The sandbox dev server leaves the env var unset and still serves the
  desk at `/` — one code path, two mount points.
- **Zone routing** — two zone workers routes,
  `currena.ir/gold` (exact) and `currena.ir/gold/*` (subpaths), were
  created on the zone, bound to `currena-gold-desk`; they are also
  recorded declaratively in `wrangler.jsonc` (validated with
  `wrangler deploy --dry-run`). Empirically, the zone routes take
  precedence on exactly the paths they match — everything else on
  currena.ir continues to flow to `currena-api` untouched.

**Verified live at https://currena.ir/gold:**

- The page (200, full HTML), the API under the prefix
  (`/gold/api/desk` 200, `narrativeSource: "llm"`, byte-identical to
  both the workers.dev deployment and the sandbox dev server), and the
  assets (`/gold/_next/…` 200) all serve; the trailing slash
  `/gold/` 308-normalises to `/gold`; the invalid date 400s.
- **Route precision**: `currena.ir/goldsmith` still serves the
  converter (the patterns claim only `/gold` and `/gold/*`); `currena.ir/`
  still serves the Currency Converter, unchanged (re-checked in the
  browser after routing).
- **The write path through the routed URL**: the watch CRUD cycle
  (create 201 → read-back 200 → delete → net-zero, the five original
  rules intact) over `https://currena.ir/gold/api/desk/watch`.
- **The browser golden path** at `https://currena.ir/gold` (zero console
  and zero page errors): the full surface stack renders; the digest guide
  toggles; **Print digest** fired `window.print()` with
  `body.digest-printing` active; date navigation walked back to Thu 19
  Nov (then-vs-now line renders verbatim) and returned to today; dark
  mode light → dark → light; 375px mobile with no horizontal overflow and
  the footer pushed down naturally.
- The workers.dev mirror now serves the desk at
  `/gold` (its root 404s, as expected with basePath) — kept enabled as a
  preview; the canonical URL is **https://currena.ir/gold**.

**Honest note:** the old gold-page URL space under `/gold/*` is now the
desk's own namespace — any pre-existing converter sub-paths under
`/gold/` (none were found: the converter served its shell at `/gold`
itself) would now meet the desk's 404 instead. The converter's own pages
outside `/gold` are untouched.

### The redeploy carrying the visualized gold page (2026-11-23)

The owner's instruction ("push commit merge in main and deploy to
cloudflare") made the tree that matters be **main itself**: the gold page
visual explanation layer (commit `53ad0c05`, already on main) plus the
deployment infrastructure carried onto it (commit `95f9be3c`) — one tree,
pushed to main, deployed. The port took exactly the deployment pieces
from `feat/gie-deploy-currena-worker` and nothing else (the gold page
tree is byte-identical to `53ad0c05` — `db/custom.db` verified identical
to the archive the first deploy seeded, all row counts unchanged).

**The run (credentials env-only, never stored or printed):**

- The account and the worker were verified first: worker
  `currena-gold-desk` and D1 `aurum-desk` present from the first deploy;
  `EODHD_TOKEN` still attached (secrets persist across versions).
- **The D1 seed was deliberately NOT re-run.** The live D1 had continued
  on its own since the first seed exactly as designed (9 DeskDay /
  3461 Observation / 6 SourceSync / 5 WatchRule vs the archive's 6 / 3457
  / 6 / 5 — the Worker's own daily syncs fired after the seed). Re-seeding
  would have rolled back live-collected data; `/api/gold` reads only the
  Observation store, so the deployed page serves its fresher closes
  (the live `pctileYear` honestly differs from the sandbox's — the
  deployed store has four more observations).
- `NEXT_PUBLIC_BASE_PATH=/gold` on both `worker:build` and
  `worker:deploy` (the OpenNext CLI rebuilds on deploy — the env var
  rides both), same zone routes from `wrangler.jsonc`.

**Verified live at https://currena.ir/gold after the redeploy:**

- The page (200, full HTML, zero console and zero page errors), the new
  `/gold/api/gold` (200 on both the zone route and the workers.dev
  mirror — spot 3532.83, series bars from the live observation store),
  and `/gold/api/desk` (200, `narrativeSource: "template"` — the
  fail-closed path; `?source=modelled` 200).
- Route precision re-checked: `currena.ir/` still serves the Currency
  Converter untouched; the workers.dev mirror root 404s (expected with
  basePath) while `/gold` serves.
- The browser golden path on the live URL: the visual explanation layer
  renders (see-saw, price tags, gauge, split bar, crowd, spine, fan,
  seats, episodes, if-you'd-bought); the EN ⇄ fa/RTL toggle flips the
  document direction; dark mode applies; 375px mobile with no horizontal
  overflow and the footer pushed down naturally.
- The ported sandbox tree browser-verified the same way before the
  push (the dual-runtime `db.ts` seam on its sandbox path, the
  deskBasePath-prefixed fetch with the env var unset, lint green).

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

### The record sections restored (2026-11-23, after the redeploy)

The owner's audit caught what the visualized rebuild had dropped: whole
sections the previous gold page (the upstream Currena site, live at
currena.ir/gold until 2026-11-22 21:06 UTC, tree `e45397b`) carried. The
audit walked that tree's GoldPage section by section against the
visualized page and found nine missing pieces — restored in commit
`e8be422a`, all bilingual EN + fa/RTL on Currena's own tokens,
display-only (nothing joins the 37-voter balance):

- **The TA reference levels** (the owner's explicit miss): SMA
  20/50/100/200, the distance-from-200DMA decile over the named stored
  basis, the dated 50/200 crosses with the 20-session follow-through,
  and the classic daily/weekly pivots — the engine ported verbatim
  (`src/lib/gold-page/ta.ts`, the C5 honesty rules riding along).
- **The central-bank demand tracker** (the owner's explicit miss): the
  rolling-12m reported-world series with the three dated episode
  annotations, the top-buyers table (latest month, 12-month net,
  holdings, the live-priced gold share of reserves with the 6-quarter
  vintage bound), the honest exceptions, the IMF method block.
- The London vault + clearing cards, the gold/yield correlation
  companion (the dual-axis chart + the 52-week rolling Pearson strip +
  the 2022 rotation marker, the registered windows verbatim), the CFTC
  positioning cards (each on its own bar domain), the
  market-expectations strip (Polymarket + the gold-relevant calendar),
  the live Iran-premium history inside the bridge chapter (the Emami
  حباب day-by-day), the 24-record relationship map (ported byte-faithful),
  and the publication-notes disclosure in the footer.

**The data seam (the one architectural decision):** the upstream page
fetched these legs browser-side from its own worker
(currena.ir/api/insights/*). The desk page now serves at currena.ir/gold —
same origin, but the browser-side fetch would be CORS-blocked on the
workers.dev mirror and the sandbox preview, so every leg is fetched
SERVER-SIDE by the desk's own routes
(`src/app/api/gold/{ta,cb,lbma,premium,positions,expectations,correlation}`
over `src/lib/gold-page/legs.ts`, memory-cached 5 min) and re-served to
the page. Verified all seven live legs still answer on the account
(gold-ohlc 363 bars, gold-cb through 2026-10, gold-lbma, gold-premium
through 2026-11-22, the projection's CFTC readings, gold-expectations,
the real-yield history) before building on them. Each section renders
its honest unavailable line when its leg does not arrive — never a
guess.

**The honest limits, stated:** the TA decile's basis and the correlation
display window are the STORED spans (the OHLC leg carries 363 bars —
~1.5 years; the upstream's own S13-D1 posture, the span named at point
of use and self-widening when the source plan does); the 50/200 crosses
and the correlation rotation marker can therefore be absent or sparse —
rendered honestly ("No 50/200 crossover in the stored window yet"), the
exact fail-closed wording the upstream carried. The correlation strip
over the current span is short (the honest render; it self-widens).

**Deploy note (the mistake caught in the run):** `worker:deploy` alone
re-uploads the EXISTING `.open-next` bundle — it does not rebuild. The
first deploy attempt at 01:20 shipped the 00:24 bundle (the new routes
404'd); the runbook's own two-step (`worker:build` THEN `worker:deploy`,
both with `NEXT_PUBLIC_BASE_PATH=/gold`) was re-run and the new routes
appeared (`/gold/api/gold/*` all 200 on both the zone route and the
mirror). Recorded so the next session does not repeat it.

**Verified live after the restore-build:** the page renders all twenty
sections (the thirteen prior + the seven new bands + the
premium-inside-bridge) with live data end to end — TA: SMA
3,903/4,015/4,201/4,240 and −16.6% below the 200-day average at the 1st
percentile of the stored 1.5 years; CB: Poland +159.1t 12-month net,
Kazakhstan 74.7% share; vault 9,850 t; premium +9.28%; positions
40.7/51.5; the Fed-December event; 25 relationship records — EN + fa/RTL
(Persian digits and dates throughout), dark mode, 375px mobile with no
horizontal overflow, zero console and zero page errors, lint green.

### The if-you'd-bought calculator restored (2026-11-23, the second audit)

The owner's second audit found the one piece the first restoration still
missed: the **"If you bought Gold" calculator** (the upstream
`GoldIfBought`, GPE R33 / F26 — the page's Zone O card, named by the
owner explicitly). The first audit had restored nine record sections but
left only a gold-only near-window bars chart in the history tail — the
full calculator (gold vs S&P 500 vs Bitcoin vs silver since the year the
reader picks) was absent. This session fetched the previous page from
the repository (tree `e45397b`), walked it section by section again, and
restored the calculator whole:

- **The pure engine ported verbatim** (`src/lib/gold-page/ifbought.ts`,
  from upstream `packages/insights/src/domains/gold/if-bought.ts`): the
  lump multiple, the monthly DCA ($100 at each month-end close, the SA
  convention, the running month included, the value marked at the
  running month's close), and the decile of the window's lump return
  among ALL same-length windows over the asset's own series — the R19
  posture (min base 30, the basis named, the honest waiting line below
  it). `windowCloses` rides along; `yearOptions` off the series' own
  coverage.
- **The data leg** (`GET /api/gold/ifbought`): the still-live currena-api
  route `/api/insights/gold-ifbought` — per-asset month-end closes since
  2016-11 (120 anchors + the current running point per asset) — fetched
  SERVER-SIDE through the desk's own seam (`legs.ts`, memory-cached
  5 min), fail-closed 503 with the honest line. The page computes
  client-side through the pure engine — the route serves data, never
  arithmetic (the upstream design, kept).
- **The band** (`src/components/gold-page/ifbought.tsx`): the year picker
  (years ungrouped — 2026, never "2,026"; the first-year note "from
  November"), the four stacked result rows (asset name + the signed lump
  percent + a one-glance bar on the same number + the window NAMED at
  point of use + the DCA line + the decile line or its honest waiting
  line), the method line first, then the disclaimer, the series-bases
  line and the series' own stamp. The section stays ALIVE even when its
  leg does not arrive — the header + the honest waiting line render
  regardless, never a silent drop (the owner's rule for this band).
  Anchored `#gold-ifbought`, one nav chip, one row in the sticky nav.
- **The copy verbatim from the upstream dictionaries** (EN + fa, the
  `pd.gold.ib*` keys): the fa window line "تا" + the fa DCA arrow "←",
  the fa month convention "م/سال", Persian digits throughout.

**Verified in the sandbox before the push:** the calculator renders
live end to end — default year 2025 (gold +25.8%, S&P +18.8%, BTC −42%,
silver +27.9%, each with its DCA and its decile over 99 same-length
windows); the picker set to 2016 flips to the honest "Nov 2016 → Nov
2026 · 121 months" window with the decile waiting line ("this window
has 1") — the upstream's own honesty at the series edge; the DCA
independently recomputed in Python off the raw payload ($12,100 →
$23,593, +95.0% — byte-identical); EN ⇄ fa/RTL with Persian digits
(+۲۰۲٫۳٪, ۱۲٬۱۰۰ دلار ← ۲۳٬۵۹۳ دلار); 375px with zero horizontal
overflow and the 44px picker target; 17/17 sections, the footer intact,
zero console errors, lint green.

**Verified live after the calculator build (currena.ir/gold + the
workers.dev mirror, both serving the new `/gold/api/gold/ifbought`
route at 200):** the section renders with live data end to end — the
default 2025 window (gold +25.8%, S&P +18.8%, BTC −42%, silver +27.9%,
each with its DCA and its decile over 99 same-length windows), the
picker set to 2020 flipping to the 83-month window with the deciles
now lighting (39 same-length windows — above the 30 minimum), the
2016 edge case rendering the honest "Nov 2016" window + the waiting
line ("this window has 1") as verified in the sandbox; fa/RTL with
Persian digits (+۱۲۳٫۶٪, ۸٬۳۰۰ دلار ← ۱۳٬۲۲۳ دلار, صدکِ ۵ از ۳۹) and
the fa nav chip; 17/17 sections intact, 375px with zero horizontal
overflow, zero console and zero page errors. The two-step deploy
runbook followed (build then deploy, both with
`NEXT_PUBLIC_BASE_PATH=/gold`).

### The third audit: the remaining sections restored (2026-11-23)

The owner's third audit ("compare current deployed version with 48-72
hours ago; find the gaps and fill them") walked the reference tree
again — `e45397b`, the upstream gold page live at currena.ir/gold until
2026-11-22 21:06 UTC — section by section against the deployed page, and
found FIVE more pieces the first two restorations had left behind. All
restored this session, bilingual EN + fa/RTL on Currena's own tokens,
display-only, fail-closed:

- **The time machine** (GPE R31/F12, the owner's Zone C Advanced
  control): the date-parameterized meter — pick any day 2016-11-01 →
  today, get that day's beam, counts and lane readings under the
  then-current versioned voter table, with the backfill/live
  provenance line and the era-boundary note. Served by
  `GET /api/gold/meter?date=…` over the still-live upstream
  `/api/insights/gold-meter` leg (memory-cached 5 min server-side);
  the picker's own min + the route's own rejection keep the era bound.
- **The education on-ramp + the six-question FAQ** (GPE R20/F4a): the
  five drivers (each closing with the LIVE lane count + lane word from
  the same balance the hero reads), the two governance notes
  (fuel-not-driver; why five here ≠ five in the meter), and the FAQ
  tail — the copy verbatim from the upstream dictionaries, EN + fa.
- **The context cards** (Zone J): the eight ratio cards (gold/silver,
  gold/btc, gold/aud, gold/oil, gold/platinum, the real gold price,
  gold/copper, gold/S&P — each with its own 10-year position band, the
  plain meaning sentence, and 30/90-day changes) + the five-currency
  gold grid (EUR/AUD native, JPY/GBP/CNY derived, each row's latest
  close + 30-day change + decile over its own stored window, and the
  KGX validation sentence) + the physical trio (SGE withdrawals, the
  Swiss flow, the Shanghai premium under the «بازار فیزیکی» header) +
  the forecast-accuracy retrospective (LBMA's analyst-survey record:
  16 scored years + the pending 2026, the mean −2.1%/mean-abs 8.1%
  aggregates, the 2025 −20.2% headline, the 17-row table one tap away,
  beside Currena's own no-edge posture). Served by
  `GET /api/gold/projection` + `GET /api/gold/crosses` over the
  still-live upstream `/api/insights/pages/gold` (48 readings with
  percentile10y/sd10y/fromPeak10y) + `/api/insights/gold-crosses`.
- **The seven-state conditions outlook** on the signals gold card +
  the chart's range chips: the upstream classifier (`goldOutlookOf`)
  ported verbatim over the page's own balance + the gold's 30-day
  speed + the projection's own 10-year position band; the verdict word
  renders in the upstream's own seven states (Strong bullish … Mixed
  signals, EN + fa). The chart gains the 90-day/1-year range chips over
  the TA leg's own closes (the ta route now also serves the raw daily
  closes — one leg, two surfaces, the honest stored span named).
- **The live Tehran board** inside the Iran bridge: every instrument's
  market price beside its computed حباب premium (Emami, Bahar, half,
  quarter, gerami, 18K, 24K, mesghal — the coin-premium engine ported
  verbatim: toman-per-ounce = ounce × free-dollar, intrinsic = × pure
  content), the parity line naming the toman-per-ounce, the snapshot
  time, and the source note. Served by `GET /api/gold/rates` over the
  still-live upstream `/api/rates` snapshot; the premiums are computed
  client-side through the pure engine — the route serves data, never
  arithmetic (the upstream design, kept).

**What was already covered and re-verified:** the TA reference levels,
the central-bank tracker, the London vault, the correlation companion,
the CFTC positions, the expectations strip, the Iran premium history,
the relationship map, the if-you'd-bought calculator (the first two
audits' restorations, all answering 200 on the account's legs before
this build started); the episode timeline's static records (the
upstream's nine-record list rides the page's own ten-episode content,
and the upstream's own price-path leg honestly answers 503 not-ready).

**The remaining honest deltas, stated:** the deep per-record sheets
(the upstream's expanded + technical tiers behind a details panel) and
the hero's 1d/7d movement toggle stay un-ported — the page's own
briefing card and signals card carry the same information at reader
level; porting the 52-record deep layer is its own sitting. The
`fromCache` honesty label does not apply (the desk's legs are
fail-closed, never stale-cached).

**Verified in the sandbox before the push:** all twenty sections
render (`#gold-briefing … #gold-relationships` including the four new
`gold-timemachine`, `gold-onramp`, `gold-context`, and the board inside
`gold-bridge`); the time machine exercised end to end (2026-11-18 →
"Leaning for gold", the gf-s10-37 table, all five lanes with counts +
firing, the backfill provenance line; 2026-11-23 → the live-source row
with the honest "last reading day on or before" wording; a future date
→ the honest unavailable line); the on-ramp's live closes (7/10/7/11
of the 37 factors with the lane words) + the FAQ + both notes; the
context cards (gold/silver 85.6 mid-range of its stored window, the
five crosses with 30-day changes and deciles, the KGX mixed verdict,
the physical trio, the LBMA table's 2010/2025 rows + the pending
2026); the signals verdict ("Strong bearish" — four lanes against —
with the range chips flipping the stored span Aug 26 → Nov 26 /
Mar 26); the Tehran board (Emami 243.16M toman +7.7%, Bahar +2%,
quarter +24.7%, 18K/24K +1.5%, mesghal +1.6% — the parity line
naming 3,585.26 × 267,37X); EN ⇄ fa/RTL with Persian digits and dates
(اسفند ۰۴ → آبان ۰۵, ۲۴۳٫۱۶ میلیون تومان, حباب +۷٫۷%); 375px with
zero horizontal overflow; 16 nav chips; zero console and zero page
errors; lint green.

### The redeploy carrying batch F — the owner's refinements (2026-11-23, late)

The owner reported the live page still showed the pre-F version ("I still
see the old version") — the tree was right (batch F, `ad10feb`, already
on main) but the Worker had last been deployed at 20:07, before batch F
was pushed at 23:03. The gap was deployment, not code.

**The run (credentials env-only, never stored or printed):**

- `bun install` → `bunx prisma generate` → `NEXT_PUBLIC_BASE_PATH=/gold
  bun run worker:build` → `bun run worker:deploy` (the account token +
  account ID through the environment). The first attempt built without
  the base-path env var — caught within minutes by the live checks
  (`currena.ir/gold` 404; the workers.dev mirror answering at `/`
  instead of `/gold`) and fixed by a clean rebuild
  (`rm -rf .next .open-next` first) with the variable set; the canonical
  URL never served the bad build to the owner for more than a few
  minutes, and the second deploy (version
  `c662f97d-b6a1-439d-814d-d2ec3879020c`) restored the full route set
  (`currena.ir/gold`, `currena.ir/gold/*`, the workers.dev mirror).
- **The D1 seed was not re-run** (the live store continues on its own);
  **secrets untouched** (`EODHD_TOKEN` persists across versions).

**Verified against the live canonical URL after the deploy:**

- Every surface 200: `/gold`, `/gold/api/desk`, and the batch-F-only
  route `/gold/api/gold/fx` (serving real FX month-ends — the decisive
  old-vs-new marker; the pre-F worker had no such route).
- **The batch F refinements, browser-verified on the live page:** the
  toman row styled like every other currency row (VLM-confirmed: same
  surface, same ring, only the live tag); the wealth calculator's unit
  layer — thirteen units incl. the converter's twelve currencies, the
  toman, and grams of gold — exercised end to end (Monthly buying ·
  1,000,000 Iranian toman since Nov 2016 → invested "1 M toman × 121 =
  121 M toman · from Nov 2016 → today", worth today "5.8 bn toman" on
  its green ground (VLM-confirmed), gain "+5.6 bn toman (+4,655.1%)");
  the head-to-head meta line a 11px whisper; the time machine opened and
  read (its three how-it-works sentences; 2020-03-16 → the five-force
  meter with counts and firing, the no-lookahead provenance); the vault
  (`gold-vault`) ahead of the relationship map and the map
  (`gold-relationships`) the page's last section; the map expanded —
  six force families with the M/C/X/K evidence-class legend and their
  documented records.
- Zero console and zero page errors; 375px with no horizontal overflow;
  route precision intact (`currena.ir/` and `/goldsmith` still serve the
  converter untouched).

### The gold page, batch G: the owner's thirteen refinements (2026-11-24)

The owner's thirteen-item pass, one tree, deployed the same hour. Every
item browser-verified on the dev server (EN + fa/RTL) before the build
and re-verified against the live canonical URL after the deploy:

1. **The 1D chart was blank** — the house line chart parsed every point
   stamp as `Date.parse(d + "T00:00:00Z")`, which is invalid for the 1D
   window's intraday stamps ("YYYY-MM-DDTHH:mm"): every parse returned
   NaN, the model collapsed, and the chart rendered an empty div. One
   shared `pointTime()` parser now reads both the daily and the
   intraday stamps honestly (12 call sites), and a sub-day x-span
   labels its own axis in UTC clock times instead of month names.
   Live: 37 intraday points, 05:00 → 23:52 axis.
2. **The calendar's rows carry only the day + the days-until** — each
   event's "why it moves gold" explanation sits behind a ؟ button and
   a Radix dialog (the factor modal's own pattern, focus restored to
   the pressed row on close). Live: "۵ آذر ۱۴۰۵ · ۲ روز بعد" +
   "ادعای بیکاری" + the why, in the modal.
3. **تقویم چگونه ساخته می‌شود rewritten in plain Persian (and EN)** —
   two kinds of dates: the exact ones from the banks' own calendars,
   the rest in their usual week with an ≈, never a prediction.
4. **ابتدای سال میلادی removed from طلا در برابر جایگزین‌ها** — the
   compare band's window chips ride 3M/6M/1Y/3Y/5Y only (the briefing
   table and the calculator's what-if windows keep their own YTD rows,
   which the owner asked for in an earlier batch).
5. **The Fibonacci correction levels are behind their own modal** —
   the TA band's open layer is the verdict + the nearest
   support/resistance sandwich + the three reading facts; the three
   retracement prices, the swing's own dates and the note open from a
   "سطوح اصلاح فیبوناچی · باز کردن" pill.
6. **درسِ هم‌بستگی merged into the comparison band** — the old
   standalone gold-correlation section is gone (id `gold-correlation`
   no longer exists); its dual-axis chart, its rotation marker and its
   method details ride inside طلا در برابر جایگزین‌ها behind one
   "درسِ هم‌بستگی · طلا و بازدهی واقعی" tap, where the real-yield
   line already lived.
7. **The ratios show the classic trio only** — طلا/نقره، طلا/نفت and
   قیمت واقعی طلا in the open, the other five behind a
   "بقیهٔ ۵ نسبت‌ها" expand.
8. **طلا در شش ارز → طلا در مقابل ارزها** (EN: "Gold against the
   currencies").
9. **بازار فیزیکی is its own section** — `gold-physical`, the bigger
   title + subtitle + THE verdict in the TA verdict's own loud gold
   box; the trio's numbers still behind their expand. It sits between
   the dashboard and the Iran chapter, and rides the section nav as
   "Physical / فیزیکی".
10. **پل ایران → بازار طلا در ایران** (EN: "The gold market in
    Iran"; nav chip "ایران").
11. **قسمت‌های بزرگ طلا → مهمترین رویدادهای تاریخ طلا** — and the
    section moved to the page's very bottom, below the relationship
    map (the nav's last chip).
12. **The calculator's non-dollar-units note removed** (EN + fa).
13. **The head-to-head shows percent only** — the "خرید ماهانه …"
    DCA dollar meta (a default the reader never set) is gone from
    every asset row in both the calculator's what-if windows and the
    if-you'd-bought head-to-head; each row carries the asset, the
    percent, the bar and its own named window.

Deployed as worker version (the `NEXT_PUBLIC_BASE_PATH=/gold` build,
D1 and secrets untouched — the documented procedure), and verified
against https://currena.ir/gold: every route 200, zero console and
zero page errors, 375px with no horizontal overflow, the fa/RTL walk
confirming all thirteen items above.

### The wrap-up record: batch G on GitHub, the desk re-verified (2026-11-24, early)

The sitting opened to wrap the previous one: local main sat one commit
ahead (0fddb585, batch G) with no deploy-record commit after it — the
state the context cutoff left behind. What the audit found and did:

- **Pushed**: the fetch showed GitHub already carried 0fddb585 (the
  previous sitting had pushed it right after committing; only the local
  tracking ref was stale). `git push` confirmed everything up-to-date —
  origin/main == 0fddb585, tree clean.
- **Deployed, independently re-verified**: `wrangler deployments list` —
  the live worker version `168dda40-fe04-470b-b7b1-8978cfe4ad27`,
  created 2026-11-24T00:01:01Z, built on the batch G tree minutes before
  its commit (the worker version the batch G record left unnamed).
  currena.ir/gold and the workers.dev mirror answer 200 with equal
  shells; the served section nav carries batch G's own structure (the
  `gold-physical` chip, `gold-history` as the last chip, no
  `gold-correlation` chip); the full API sweep green — every
  `/gold/api/gold/*` route 200, `meter` and `daily` answering their honest
  parameter 400s without a date and 200 with it; `currena.ir/` and
  `/goldsmith` untouched. No new deploy was needed — nothing in the app
  changed after 0fddb585; this sitting's commits are documentation only.
- **The sandbox mirror synced**: the eight batch G files + AGENTS.md
  copied to the sandbox tree, the dev server restarted on the current
  tree.

### The WGC monthly commentary spec — the highlights pipeline, proposed (2026-11-24)

The owner's new brief: scrape the Highlights box of the World Gold
Council's monthly Gold Market Commentary — highlights only — once a
month, bounded to the dates the issues actually appear ("they might
publish this with delay"). The research ran first, per the brief: 48 URLs
(2023-01 → 2026-10 plus the skip months and two not-yet-published
controls), fetched by the probe now in `scripts/wgc-probe.ts`, the raw
census (every segment verbatim) in
`docs/evidence/wgc-census-2026-11-24.json`. What it established:

- The series is **ten issues a year** — every June and November has no
  issue at all (clean 404s every year observed; June 2026 instead
  301-redirects to July's issue — the exact trap the spec's slug guard
  exists for, caught by comparing the final URL's slug).
- Publication lands **4–12 days after the reviewed month's end** (39
  genuine issues: median 7, always 08:00 London) → the proposed bounded
  window: daily 09:30 UTC on days 1–15 of the following month plus
  alternate grace days through 25, stop-on-success, at most 20 attempts
  per month, zero requests in the skip months.
- The Highlights box exists only since the **2025-03** issue, always
  exactly two segments, and WGC rotates **five markup shapes** for it
  (h2/h3 box heading × h3 subheads / strong-paragraph heads /
  strong+`<br>` single paragraphs / `ul-li` bodies) — the parser
  contract tokenizes all five, was validated against all 17 box issues,
  and reproduces the owner's own pasted September snippet byte-identically
  (two research iterations were needed to find the `li` bodies and the
  `strong+br` paragraphs — both now in the contract).
- The proposed architecture, all of it in the spec: a separate tiny
  `currena-wgc-watch` Worker on the same D1 (`aurum-desk`), cron-bounded
  and slug-guarded, two D1 tables (`wgc_commentary` + a scrape log),
  structure-change alarms, a read-only `/gold/api/gold/wgc-commentary`
  route, a bilingual card with the LTR block and the whisper meta line,
  a 17-row backfill (2025-03 → 2026-10), and the acceptance list for the
  implementing sitting (re-run the probe first).

**Status: proposed only — nothing built, deployed, or wired in this
sitting.** The full document: `docs/wgc-monthly-commentary-spec.md`.

### The WGC Highlights pipeline — implemented (2026-11-24, the implementing sitting)

The sitting that implemented docs/wgc-monthly-commentary-spec.md in full.
Everything below was exercised live unless stated otherwise; the evidence
lives under tests/ (the harness JSON + the walk PNGs) and
db/wgc-backfill-remote.sql (gitignored, the generated remote D1 statement
tape).

**The opening gate — the probe re-run (§10.1):** `bun scripts/wgc-probe.ts`
re-fetched all 48 URLs and diffed byte-identical against
docs/evidence/wgc-census-2026-11-24.json — gold.org had not drifted; the
census and the spec stood unchanged and no spec update was needed.

**What was built:**

- **`wgc-watch/` — the `currena-wgc-watch` Worker** (zero npm dependencies,
  plain TypeScript): `src/parser.ts` (the production Highlights parser —
  the probe's validated tokenizing logic plus the spec §4.4 defensive
  block re-cut), `src/pipeline.ts` (the month math, the canonical URL,
  the slug guard, the storage gates, the sha256 content hash, the
  `applyCapture` upsert shared by fire and backfill, and `runFire` — the
  bounded-window state machine), `src/index.ts` (the scheduled handler +
  the read-only health endpoint), `ddl.sql` (spec §4.6 verbatim), and
  `wrangler.jsonc` (the two cron expressions, the shared aurum-desk D1
  binding). One deviation from the spec's letter, forced by tooling:
  the config is `wrangler.jsonc`, not `wrangler.toml` — wrangler 4.166's
  plain `bunx wrangler deploy` from wgc-watch/ resolved the repository
  root's wrangler.jsonc over the subdirectory's wrangler.toml (the
  known mistake encoded in the runbook, now in config form too); the
  JSONC form (the desk's own convention) resolves correctly.
- **The D1 tables** (spec §4.6 verbatim, applied with
  `wrangler d1 execute aurum-desk --remote --file wgc-watch/ddl.sql`
  twice — no error, the idempotence proof): wgc_commentary +
  wgc_scrape_log on the same aurum-desk, no existing table touched, no
  seed re-run, secrets untouched.
- **The backfill** (`scripts/wgc-backfill.ts`): the one-off idempotent
  walk 2025-03 → 2026-10 (17 issues, June/November skipped with zero
  requests), the same `applyCapture` as the fire; writes local SQLite
  directly (`--db`) and the remote D1 through a recording scratch whose
  statement tape is applied via `wrangler d1 execute --file`
  (`--remote`). The runs: local stored 17; local re-run unchanged ×17
  (zero writes); remote stored 17 (34 statements); remote re-run
  "0 statements — the remote state already matches; nothing applied".
  A bonus path proven in the sandbox: a structure_alert month re-stored
  to ok through the backfill (16 unchanged + 1 stored). Evidence:
  tests/wgc-backfill-2026-11-24.json (five recorded runs).
- **The API route** `GET /gold/api/gold/wgc-commentary` (latest, or
  `?month=YYYY-MM`): read-only, fail-closed, D1 only, the four honest
  statuses (ok | waiting | missed | structure_alert) with the last known
  good riding beside the non-ok states, the waiting attempt count read
  from the scrape log, the derived window-close (day > 25 with no row →
  missed), the honest 404s (pre-box months, skip months) and 400 (bad
  month format). The desk's Prisma schema gained the WgcCommentary +
  WgcScrapeLog read models (mapped 1:1 to the DDL columns).
- **The card** (`src/components/gold-page/wgc-card.tsx` + the `wgc` copy
  blocks in content.ts, EN + fa): placed directly under the Market
  Brief; the fa title «نگارش ماهانهٔ شورای جهانی طلا» with the EN
  subtitle (mirrored in EN); the two English segments VERBATIM inside a
  `dir="ltr"` blockquote with the canonical `cite`; the 11px whisper
  meta line (published date, fetched date, «منبع: World Gold Council» —
  the anchor IS the gold.org link); the honest waiting/missed/
  structure_alert/skip states riding the same card; the record-basis
  note (the box exists only since the March 2025 issue; the 22 earlier
  issues are not backfilled — stated, never hidden); Persian digits and
  calendar dates in fa (۸ آبان ۱۴۰۵), the year never grouped.

**A second seam normalization, documented inline (src/lib/db.ts):** the
D1 adapter (@prisma/adapter-d1 6.19.2) infers column types from VALUES —
D1 result sets carry no declared types — and any ISO-datetime-looking
string is reported as DateTime, so the wgc tables' verbatim ISO-TEXT
timestamps (the §4.6 contract) failed typed reads on the Worker
("Error converting field publishedAt …"). The Worker path of the seam now
prefixes exactly those string cells (the adapter's own two regexes,
copied verbatim) with a sentinel inside the adapter's `raw()` results,
and the route restores the verbatim bytes with `unwrapD1Text` — the
read-side twin of the existing DateTime bind shim, one code path on
both runtimes (the sandbox never sees the sentinel; unwrap is a no-op
without it). Every other TEXT column of the archive (dates, ids, JSON,
URLs) passes untouched; the S8–S14 DateTime columns store millis
INTEGERs and are unaffected.

**The harness (tests/wgc-harness.ts — ALL CHECKS PASS, evidence
tests/wgc-harness-2026-11-24.json):** the production parser (imported,
never copied) over all 17 box issues fetched live — 17 × 2 segments,
byte-identical against the census (segments, variants, publication
dates), every heading non-empty, every body ≥ 40 chars, the defensive
block re-cut never firing (no nested div observed), and the owner's
pasted September snippet reproduced byte-identically (2026-09) with the
JSON-LD description cross-check; all five body styles exercised with
their own witnesses (h2+h3+p; h2+h3+li 2025-03/2025-07; h2+strong-p
2026-02/04/07; h2+strong+br + trailing note 2026-05; h3 box
2026-08/09 — the spec's acceptance list names "2025-08 <h3>+<p>",
which the census dates as h2+h3+<p>; 2026-08 is the h3-box issue);
the negative paths live (2023-02 no box → structure alarm, nothing
stored; June-2026 → the slug-guard rejection logged, no row; 2027-05
far-future 404 and the 2026-12 not-yet-published control → waiting);
the clock walk over the production `runFire` against a scratch SQLite
D1 (days 1–7: six 404s then one 200 → attempts 7, status ok; days 8–9
stop-on-success with zero further requests; June and November targets →
skip-month with zero requests; the 21st fire attempt-bound at 20; the
day-25 close → missed; the natural 20-fire window ending in one missed
close; a simulated WGC edit → re-stored with updated_at bumped and a
re-stored log line; the unchanged re-run → nothing written, no attempts
bump, no log line). The harness also proves the DDL idempotent twice on
its scratch database.

**Browser-verified (agent-browser + VLM, evidence
tests/wgc-01…09-*.png):** the card in EN and fa/RTL, the whisper line,
the LTR block inside the RTL page, the four states exercised through
the route by honest database manipulation (ok live; waiting by removing
the October row; missed by a window-closed row; structure_alert by an
alert row — each rendering its state line with the last known good
beside it), dark mode, mobile 375px with zero horizontal overflow and
the footer pushed down naturally, zero console and zero page errors
across every walk. One rendering bug caught and fixed by the walk
itself: the year formatted through Intl with a grouping separator
("October 2,026") — the year now renders plain ("October 2026" /
«اکتبر ۲۰۲۶»).

**Deployed and live-verified:** the desk redeployed through the two-step
runbook (NEXT_PUBLIC_BASE_PATH=/gold on BOTH build and deploy — the
encoded mistake avoided), live version
`cca13b4f-1c60-48a3-b0fd-5bffa9f4034d` (2026-11-24T01:38Z). Live at
https://currena.ir/gold: the card renders end to end (EN + fa verified
in the browser against the live URL, zero console errors, 375px
clean), the new route serves the exact §5 shape byte-perfect
(publishedAt verbatim), and the FULL route sweep stayed green — every
/gold/api/gold/* and /gold/api/desk/* route 200, meter and daily
keeping their honest parameter 400s, /gold/ still 308-normalising to
/gold, currena.ir/ and /goldsmith still serving the converter
untouched, the workers.dev mirror serving /gold and the new route. The
watch worker answers its health endpoint
(https://currena-wgc-watch.sedanama-ir.workers.dev) with the last three
log lines, the current target month's row, and the cron schedule —
reading the same D1 the desk reads.

**Honestly NOT done — stated, never hidden:**

- **The cron triggers could not be attached.** The account is on the
  Workers Free plan, which allows five cron triggers per account, and
  the owner's live workers consume all five (currena-api's every-minute
  trigger + currena-markets' four daily triggers — the owner's
  services, left untouched per the house law). The deploy uploaded
  currena-wgc-watch but the trigger attachment failed (Cloudflare error
  10072, "the Workers Free limit of 5 cron triggers per account"). The
  worker is deployed with its triggers declared in wrangler.jsonc; the
  moment a slot frees (or the plan upgrades), one `bunx wrangler deploy`
  from wgc-watch/ attaches them with zero code change. Consequences,
  stated plainly: the scheduled pipeline has NOT fired live yet, and
  the acceptance item "the cron observed firing at least once
  (health endpoint or scrape log)" is NOT MET — the fire logic itself
  is proven end-to-end by the harness (every path: skip, bound,
  stop-on-success, 404, redirect-rejected, stored, re-stored, missed,
  structure-alert), and the first live capture of the 2026-12 issue
  waits on the trigger slot. The calendar at deploy time: November's
  fires target October (already backfilled — stop-on-success exits);
  December's target November (a skip month); the first real live
  capture is the 2026-12 issue, expected early January 2027 inside the
  measured window, once the triggers attach.
- One addition beyond the spec's event vocabulary, for honesty: the
  spec's §4.3 names timeouts/5xx as "attempts++, next fire" but assigns
  them no log event; mislabeling them fetch-404 or leaving them
  uncounted would both be dishonest, so the pipeline logs them as
  `fetch-error` (detail carries the cause) and the attempt counts and
  the route's waiting counter include them. The DDL comment (verbatim
  §4.6) lists the seven spec'd events; the eighth value is this
  documented extension.

### The cron quota freed — markets consolidated to one trigger, the watch crons attached (2026-11-24, later)

The owner's instruction: "since we have limited amount of cron jobs,
dedicate only 1 cron job for markets page, so we have available cron
jobs then." What was found, what changed, and how it is proven:

**The quota before:** the account's Workers Free plan allows five cron
triggers; currena-api's every-minute trigger and currena-markets' four
daily ones (MAIN "30 23 * * 1-5", RETRY "30 1 * * 2-6", ASIA
"50 8 * * 2-6", AU "0 7 * * 1-5") consumed all five — the exact wall the
previous sitting hit (error 10072).

**The consolidation (behavior-preserving, not job-dropping):** dropping
three schedules would silently kill the AU job and the retry runs, so
instead the deployed handler was patched to a time-based dispatch and
the four triggers became ONE covering expression:
`0,30,50 1,7,8,23 * * *`. The markets worker's scheduled handler
branched on `event.cron` string equality; the patch derives the job
from the fire's own `event.scheduledTime` (UTC day/hour/minute) —
byte-equivalent at every original fire time, with the covering
expression's extra wakes logging one line and returning. The
equivalence is proven offline over every minute of a full week
(10,080 minutes, zero mismatches, all 20 weekly real jobs covered,
64 logged no-op wakes — tests/markets-cron-equivalence-test.ts, the
record in tests/markets-cron-consolidation-2026-11-24.json). The upload
touched ONLY the `var index_default` scheduled-handler region (every
other byte of the 1 MB bundle identical), rode the Workers script API
with `keep_bindings` so the EODHD_API_TOKEN secret survived without its
value ever being read, and re-declared the RATES KV binding and the
observability settings from the fetched state — verified intact after
the swap (bindings, invocation logs, compatibility date).

**The rollback**, if ever needed: the original deployed bundle is kept
byte-exact at /home/z/markets-rollback-2026-11-24/ with the upload
metadata, the pre-change settings, and both index.js versions; the
procedure is PUT the original with the same metadata, then PUT the four
original schedules as a bare array.

**The watch crons attached** — `bunx wrangler deploy` from wgc-watch/
succeeded with both schedules live (30 9 1-15 * * and
30 9 17-25/2 * *), worker version debd06ce. The account now runs
4 of its 5 triggers (api 1 + markets 1 + wgc-watch 2, one spare), and
the WGC pipeline's last open acceptance item — the cron observed firing
— is armed: the next fires are November 25 09:30 UTC (a grace-day wake;
the target 2026-10 is captured, so the fire exits stop-on-success and
its console line lands in the worker's stored observability logs) and
December 1+ (skip-month lines for the November target in the scrape
log). The markets worker's patched dispatch proves itself in its own
stored logs today: 07:00 UTC the AU job, 08:50 the Asia retry, 23:30
the main run, with the covering wakes between them.

**One owner action, stated plainly:** the markets worker's SOURCE (the
owner's monorepo, packages/insights — not this repository) still
carries the string dispatch and the four-cron wrangler config; the next
deploy from that source would revert the dispatch and re-request four
triggers (the quota now has room for one, so the attach would be
partial and the dispatch would not recognize the covering expression).
Port the time-based dispatch and the single covering cron into the
source repo — the deployed patch (kept at the rollback path above) is
the reference implementation.

### The follow-up sitting: the checks re-armed, the rollback kit restored, the source port landed (2026-11-24, 02:15–03:00 UTC)

The sitting opened to verify the two scheduled observations — and the
clock settled it first: **02:14 UTC, before both checks** (09:10 UTC
today, 09:40 UTC Nov 25) and before the fires they observe (the patch
itself is only ~25 minutes old at open — the consolidation ran 01:50Z,
the commit 01:53:48Z). Neither observation could have landed; the
honest finding is below, plus what the sitting found and fixed.

- **The scheduled checks were mis-armed — deleted and re-armed.** The
  two one_time jobs carried epoch-millisecond expressions
  (1795511400000 / 1795599600000 = 2026-11-24 09:10Z / 2026-11-25
  09:40Z) that the scheduler parsed as SECONDS: their computed
  next_run read year 58867/58870 — they would never have fired, and
  both acceptance observations would have silently never happened.
  Both deleted and re-armed as jobs 545524/545525 with unambiguous
  Shanghai-local datetime strings (17:10 / 17:40 +08:00 = 09:10 /
  09:40 UTC; the service rejects tz="UTC" strings as "already past" —
  it parses in its server timezone), payloads updated with the
  deployed patch's VERIFIED log formats (read out of the live bundle:
  the AU success head `arkets-au] main: N written · M held · X Yahoo
  calls`; the wake `arkets] covering-cron wake at HH:MM UTC (day D) —
  no job at this minute` — the leading `[m` was eaten when the
  original source's template strings were written, cosmetic and known)
  and the housekeeping notes for the re-cloned tree.
- **The fresh-sandbox recovery.** This sandbox booted clean:
  /home/z/currena re-cloned from GitHub (HEAD 90af2645 confirmed, the
  remote token-scrubbed), /tmp/markets-inspect/obs-query.json
  recreated (the query body the checks reference, no credentials).
- **The live state, verified now:** the account runs 4 of 5 triggers
  (markets the single covering expression, attached 01:50:39Z;
  wgc-watch both schedules, 01:50:59Z; api its minute cron; desk none).
  The markets version history pins the patch as version #38
  (437c5eae, 01:50:06Z, source api) and the pre-patch original as
  version #37 (9c525932, the Nov 21 secret re-put over the Nov 10
  code upload — script etag 07ec277b…, scheduled-only handlers,
  EODHD_API_TOKEN + RATES 4627ac33 bindings, compatibility 2026-09-01).
  The observability logs (the query API proven working, 6.2M rows
  read) show the last pre-patch fires under the ORIGINAL dispatch —
  23:30:41Z Nov 23 `# markets run — main (eodhd-first) · 16 EODHD +
  16 Yahoo calls` (Monday's main) and 01:30:30Z Nov 24 `# markets run
  — retry (yahoo-first) · 0 EODHD + 9 Yahoo calls` — and ZERO
  post-patch fires (correct: the covering expression's next fire is
  07:00 UTC today). The wgc-watch health endpoint answers: targetMonth
  2026-10, the row ok (the backfill's capture), both crons, the
  window line, the last three log lines.
- **The rollback kit restored — with an honest change.** The original
  kit's byte-exact bundle copy died with the sandbox reset; the
  restored /home/z/markets-rollback-2026-11-24/ carries the re-fetched
  patched index.js (sha256 50ce5778…), the version #37 metadata, the
  current settings, the record + equivalence test, and a README whose
  procedure is now VERSION-PINNED: redeploy version 9c525932 via the
  gradual-deployments API, then PUT the four original schedules as a
  bare array. The deploy-from-version mechanism was PROVEN live this
  sitting (deployment b147b475 created from the current version #38 —
  a content-identical no-op — with the schedules verified untouched
  after; a better rollback than the lost file: no 1 MB re-upload, the
  original stays server-side).
- **The monorepo was never a separate repository — and the source port
  is done.** The consolidation record's "owner's monorepo, not this
  repository" was wrong in one letter: the owner's monorepo lives in
  THIS repository, on the upstream branch chain (insights-rebuild →
  gold-elevation/s18-closeout → feat/gold-redesign-s10-q3a →
  docs/gold-intelligence-s1-filing, the newest tip, 2026-11-21T13:16Z,
  the GIE-S1 filing). The markets worker source is **apps/markets**
  (packages/insights is the engine library it imports — the deployed
  wrangler config there names currena-markets and the live RATES KV
  id exactly), byte-identical across every tip since 2026-11-02
  (tree a2630c0e). **The port: branch `feat/markets-cron-consolidation`
  (off the filing tip), commit 8e3aadbe, pushed** — apps/markets/
  src/index.ts now carries the time-based dispatch (the deployed
  reference transcribed: Mon–Fri 23:30 main · Tue–Sat 01:30 retry ·
  Tue–Sat 08:50 the Asia retry · Mon–Fri 07:00 the ALONE AU rung;
  every other minute a one-line covering-cron wake — audit A-7's
  spirit kept), crons.ts gains COVERING_CRON with the four originals
  kept as the documented semantics, wrangler.jsonc declares the single
  covering expression, the scheduled tests are rewritten for the
  windows with day-of-week guards (12 tests; the AU-alone path gains
  coverage it never had) and the audit C-8 config test reads the ONE
  cron back out of the config. **Verified on the branch: typecheck
  clean, 19/19 markets tests, eslint 0 problems over the changed
  files, `wrangler deploy --dry-run` green (bundle 1,060.75 KiB, RATES
  binding intact). NOT deployed — the live worker already carries the
  patch; the next deploy from the merged source keeps the
  consolidation.** Records on the branch:
  docs/specs/markets-cron-consolidation-port.md, the CHANGELOG entry,
  BD-MKT-1 in docs/DECISIONS.md.
- **The preview mirror re-synced and walked.** The fresh sandbox's
  my-project was the stock template (the whole gold tree absent); it
  now mirrors canonical main (src/prisma/public/scripts/configs/
  db/AGENTS.md; bun install; prisma generate; .env.local carrying the
  EODHD token env-only). One bug caught in the sync: the archive db
  landed at the wrong path and the routes 500'd on the template's
  User/Post db — fixed (db/custom.db), then every route green
  (/api/gold, /api/gold/wgc-commentary serving the October row
  byte-perfect, the full leg sweep). Browser walk: the WGC card in EN
  and fa/RTL — the title «نگارش ماهانهٔ شورای جهانی طلا», the
  dir="ltr" blockquote with both segments verbatim and the canonical
  cite, the whisper line «انتشار ۱۴ آبان ۱۴۰۵ · بازخوانی: ۳ آبان
  ۱۴۰۵ · منبع: World Gold Council», the record-basis note —
  VLM-confirmed clean (tests/wgc-10/11 PNGs + the VLM json), 375px
  with zero horizontal overflow, the footer pushed down naturally
  (footerBottom = viewport 812 at the page end), zero console and
  zero page errors, lint green, dev.log clean.
- **Honestly not done / not yet observable — stated:** the first
  post-patch markets fires (07:00 AU, the 07:30–08:30 wakes, the
  08:50 Asia retry, all UTC today) — the re-armed 09:10 check
  observes them; the watch's first fire (Nov 25 09:30 UTC,
  stop-on-success on 2026-10) — the 09:40 check observes it; the
  December skip-month lines start Dec 1 (a later sitting verifies
  them as the ongoing liveness evidence); the port branch is NOT
  merged — the owner's integration session merges it and runs the
  full pnpm gates there; the desk worker was NOT redeployed (this
  sitting changed no desk app code — main's app tree is identical to
  the deployed cca13b4f state).

### The consolidation fires verified (2026-11-24, the scheduled check)

The 09:10 UTC check (job 545524 — the one re-armed after the
epoch-millis mis-parse) opened in a fresh sandbox (the tree re-cloned,
HEAD 281b9877, the remote token-scrubbed) and pulled the morning
telemetry for `currena-markets` from the observability query API (POST
…/workers/observability/telemetry/query, window 06:00–10:00 UTC,
filter $metadata.service = currena-markets). The consolidation fired
exactly as the deployed patch prescribes — six covering-cron fires
across hours 7–8, each carrying the covering expression
`0,30,50 1,7,8,23 * * *`:

- **07:00:33 UTC — the AU rung, alone.** `arkets-au] main: 19 written ·
  0 held · 19 Yahoo calls · snapshot written`. No wake line, no error —
  the invocation logged nothing else (the head matches the verified
  format; the `· snapshot written` tail is the patch's own suffix).
- **07:30:24 / 07:50:24 / 08:00:24 / 08:30:24 UTC — the four wakes,
  bare.** Each logged exactly one line: `arkets] covering-cron wake at
  07:30 UTC (day 2) — no job at this minute` (and the same at 07:50,
  08:00, 08:30; day 2 = Tuesday — the wake line's D is the day-of-week
  the dispatch guards on, not the day-of-year). No job lines, no
  errors.
- **08:50:25 UTC — the Asia retry, run.** `# markets run — retry
  (yahoo-first) · 0 EODHD + 9 Yahoo calls` — n225, kospi, hsi, ssec,
  taiex, nifty50 via yahoo; stoxx50, dax, cac HELD (F1: Europe is still
  intraday at 08:50, today's close not final) — `→ written (unusual ·
  n=8)`. The same invocation continued with the fx run and logged one
  non-fatal line worth recording verbatim: `[fx-store]
  insights:snapshot failed validation — ignoring stored value`, then
  `# fx run — frankfurter · 1 Frankfurter + 0 Yahoo calls` (eleven held
  pairs listed) `→ written (attention · counted=2 · pairs=11)` — the
  fx run still wrote; the validation skip ignores a stored value, it
  does not fail the invocation.

All three acceptance criteria hold: the AU rung fired alone at 07:00;
the four in-between minutes woke bare; the 08:50 retry ran. The
consolidation is now observed live, end-to-end, from the deployed
patch's own logs — the quota's single covering trigger does the work
of the original four. Still open, unchanged: the port branch
(feat/markets-cron-consolidation, 8e3aadbe) awaits the owner's merge;
the watch's first fire (Nov 25 09:30 UTC, stop-on-success on 2026-10)
is observed by the 09:40 check; the December skip-month lines begin
Dec 1.

### The WGC Persian translation — spec §8's phase, implemented against a credentials wall (2026-11-24, the translation sitting)

The sitting that green-lit the phase the spec deferred (§8): the monthly
commentary translated to Farsi via Workers AI at capture time, stored
beside the English in the desk's D1, rendered under the honest
«ترجمهٔ ماشینی» label. The implementation is complete and proven
end-to-end in the sandbox; every Cloudflare-account-facing step is
blocked by the sitting's own credentials — stated first, plainly.

**The credentials wall (the environmental fact this sitting turns on).**
Both Cloudflare tokens supplied for this sitting are rejected by the
real Cloudflare API on every surface: `/user/tokens/verify` answers
code 1000 "Invalid API Token" (the Workers-API token and the
Workers-AI token alike, in both the given prefixed form and unprefixed),
`/accounts` answers 9109 "Invalid access token", and the
account-scoped `/ai/models/search`, `/ai/run/{model}` and
`/d1/database/{uuid}/query` (wrangler) all answer 10000
"Authentication error" — while the account itself is alive and serving
(the live currena.ir/gold, the wgc-watch health endpoint and its route
all answered during this sitting), and the sitting's other credentials
are genuinely live and were used (the GitHub token cloned and pushed
this tree; the EODHD token verified against its own user endpoint).
Consequences, each stated: **the live bake-off did not run; the remote
D1 DDL apply did not run; neither worker was redeployed; the live
forced translation run did not run.** The live account is therefore
byte-identical to the e1af12d8 state — nothing was touched, nothing
broken; the live card keeps today's English-verbatim rendering (the
designed fallback) until the desk worker is redeployed with this code.

**The model research — live, from the public catalog.** The
account-level catalog API being unreachable, the catalog was fetched
live from the public docs (developers.cloudflare.com/workers-ai/models,
llms.txt + per-model pages + the raw JSON schemas): 74 models. The
Translation task family holds exactly ONE model —
`@cf/meta/m2m100-1.2b` (the other, indictrans2, is en→Indic only). The
sitting's named chat families are all present: Qwen
(qwen3-30b-a3b-fp8, 32k ctx, "groundbreaking multilingual support";
qwen3.8-27b; qwq-32b), Llama 3.x (llama-3.1-8b-instruct-fp8,
llama-3.2-1b/3b, llama-3.3-70b-instruct-fp8-fast) plus Llama 4 Scout,
Gemma (gemma-4-26b-a4b-it, 256k ctx — Google's newest on the catalog),
gpt-oss (20b and 120b), and more (deepseek v4 family,
mistral-small-3.1). The m2m100 input schema was pulled verbatim
(sync-input.json): `text`, `source_lang` (default "en"), `target_lang`
required — language codes, "fa" for Persian (the page's usage example
spells names; the runner resolves the accepted form live and records
it in the log line).

**The selection: `@cf/meta/m2m100-1.2b` — documented-capability based,
the live bake-off pending.** The honest record of the judgment: no live
run was possible, so the selection rests on what is documented. m2m100
is the only model on the catalog served under the Translation task and
the only one whose target-language contract includes Persian by
construction (M2M100's 100-language set, fairseq-documented); it is a
deterministic seq2seq translator — it cannot refuse, editorialize,
hallucinate additions, or drift a JSON shape (the pipeline translates
per-string and reassembles the `{"heading","body"}` shape itself, so
the strict output contract is structural, not prompted). The chat
families carry no documented Persian coverage at the serving level —
Llama's official language lists exclude Persian outright (the
Arabic-bleed failure mode the sitting names), Qwen3's multilingual
claim is not enumerated for fa anywhere on the catalog — and each
would need a prompted JSON contract whose refusal/drift/bleed risks
only a live bake-off could clear. m2m100's weakness is fluency — the
weakest of the shortlist — and the honest «ترجمهٔ ماشینی» label covers
exactly that (imperfection, never garbage). **The live bake-off is
delivered, not run**: `scripts/wgc-bakeoff.ts` takes the full real
payload (the D1 row or the route), runs every candidate over REST
(m2m100 per-string; each chat model under the strict-JSON contract,
parsed defensively), prints each translation beside the English with
two objective signals (Arabic-script contamination — ي/ك/tatweel;
dropped or altered numbers) and appends the evidence to
tests/wgc-bakeoff-*.json. One command, when a valid token exists:
`WORKERS_AI_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… bun scripts/wgc-bakeoff.ts`
— the selection re-opens then, and the swap is one constant
(`TRANSLATION_MODEL` in wgc-watch/src/translate.ts) plus its runner.

**What was built (the full implementation):**

- **The DDL** (wgc-watch/ddl.sql, extended in place): the additive
  side table `wgc_commentary_fa` (month_key PK, fa_headline, fa_json —
  the same `{"heading","body"}` shape and order as the English,
  source_model, translated_at, content_hash — the ENGLISH row's hash
  at translation time, the freshness key) plus the scrape-log event
  vocabulary extended with `translated | translate-failed` (the
  documented two-value extension, the `fetch-error` precedent
  followed). CREATE TABLE IF NOT EXISTS only; no existing table
  touched; no seed re-run. **Applied twice — locally only** (the
  sandbox archive and a scratch SQLite, both idempotence-proven); the
  remote apply is the blocked step, one command when credentials
  return:
  `bunx wrangler d1 execute aurum-desk --remote --file wgc-watch/ddl.sql`
  (run twice, same proof).
- **The Prisma read model** `WgcCommentaryFa` (1:1 @map to the DDL,
  ISO-TEXT translatedAt riding the db.ts read-side shim like the
  parent table's timestamps; faJson passes untouched like
  highlightsJson).
- **The translation module** (wgc-watch/src/translate.ts, zero
  dependencies like the rest of the worker): translateCommentary —
  the freshness gate (a stored fa row with a matching hash is
  up-to-date forever; a re-stored English re-opens it), the defensive
  parse of the stored English segments, the per-string translation of
  the headline and every segment, the identity/empty-output discipline
  (an output equal to the source is a non-translation — no fake
  translation is ever stored; any one string failing fails the whole
  run — no half-translated rows), the INSERT OR REPLACE write, the
  `translated` log line, and the never-throw failure path: any error
  logs `translate-failed` with the model and reason and returns. The
  runner resolves the serving's target-language form on the first
  string ("fa" | "persian" | "farsi") and reuses the winner.
- **The pipeline hook** (wgc-watch/src/pipeline.ts runFire): the
  translation rides the EXISTING capture path — right after a
  store/re-store, and as a pre-step under the stop-on-success exit
  (the retry-on-next-fire discipline: an AI failure never fails the
  capture, never re-fetches English, retries on the next fire inside
  the same window). `env.AI` is optional — without it the fire runs
  byte-identically to the old behavior (the harness's binding-less
  calls are untouched). The step only ever touches the CURRENT target
  month — no silent backfill of the 17 historical rows. The two cron
  expressions are EXACTLY as they were (30 9 1-15 * * and
  30 9 17-25/2 * *); no new trigger; the account's fifth slot stays
  free; currena-markets untouched.
- **The engine choice, documented**: the worker calls Workers AI
  through the **[ai] binding** (wrangler.jsonc `"ai": {"binding":
  "AI"}`) — the platform-native path, no secret surface to manage,
  included on the free plan, the neuron budget irrelevant at one run
  per monthly issue; the REST + WORKERS_AI_TOKEN path is what the
  bake-off and forced-run scripts use outside the worker — the same
  model, the same module (the scripts' REST adapter implements the
  module's AiLike interface; one code path).
- **The route** (src/app/api/gold/wgc-commentary/route.ts): the Farsi
  rides the ok payload — and the lastKnownGood payloads — as an
  ADDITIVE `fa` field, **always-include when fresh, absent otherwise**
  (decided, not parameterized: the card is the Persian-first page, no
  consumer needs to opt in, the flat §5 shape stays
  backward-compatible). Fresh = the side row's content_hash equals
  the English row's (a translation of pre-edit English is never served
  after a re-store) and its JSON parses into the segment shape; the
  fa layer fails closed to absent — a missing table, a stale hash or
  a malformed payload never degrades the English response. The
  payload carries the provenance: fa.sourceModel and fa.translatedAt.
- **The card** (src/components/gold-page/wgc-card.tsx + the wgc copy
  bundles, EN+fa): fa mode with a fresh translation renders the Farsi
  segments as the PRIMARY RTL text under the honest «ترجمهٔ ماشینی»
  pill — spec §8's non-negotiable, the exact words — with the
  translated headline above and the English original still available
  verbatim below (the existing dir="ltr" blockquote, now captioned
  «متن اصلی به انگلیسی — واژه‌به‌واژه»). fa mode with NO stored Farsi
  renders today's behavior exactly (English verbatim, no label, no
  fake translation); EN mode always renders the English verbatim (the
  fa layer is the Persian page's own). Persian digits and the Persian
  calendar dates ride the card's existing conventions unchanged.
- **The forced-run script** (scripts/wgc-translate-once.ts): the
  deliberate exactly-one translation of an already-captured issue
  through the PRODUCTION module (imported, never copied) — `--db`
  writes a local archive directly, `--remote` reads the live D1
  through wrangler and applies the writes as a statement tape (the
  backfill's proven pattern), `--force` replaces an existing
  translation deliberately. Idempotent without --force.

**The sandbox verification (the end-to-end proof that was possible):**
the module's contract proven against a scratch D1 (happy path — row +
`translated` log; the freshness gate — a second run is up-to-date
with zero further calls; the failure discipline — a failing engine
logs `translate-failed` and stores nothing; the identity discipline —
an engine returning the source unchanged fails, never stored; runFire
without AI byte-identical to the old behavior; a re-stored English
re-opens the gate and re-translates). The preview mirror re-synced
(the fresh sandbox's template replaced by canonical main + this
sitting's tree; bun install; prisma generate; the archive db landed
at db/custom.db; .env.local env-only) and the DDL applied twice to
it, idempotent. **The sandbox fa row for the preview walk was
produced by the production module over a sandbox-LLM adapter — and
the row's source_model says so unmistakably:
"sandbox-test/zai-llm (NOT Workers AI — preview test data)" — never
silently attributed; the live forced run later replaces the
mechanism, not the claim.** The route verified live on the mirror:
the fa field present (headline, 2 segments in order, sourceModel,
translatedAt) with the flat §5 fields unchanged beside it; a
historical month (?month=2025-03) answering without the field; the
stale-hash guard proven by round-trip (corrupt the side row's hash →
fa vanishes → restore → fa returns). The browser walk
(agent-browser, zero console and zero page errors throughout): the
fa card — «مرور اکتبر ۲۰۲۶», the «ترجمهٔ ماشینی» pill, the Persian
headline and both segments RTL («مرور اکتبر» / «نگاه به آینده»),
the captioned English original below, the Persian whisper line
(«انتشار: ۱۴ آبان ۱۴۰۵ · بازخوانی: ۳ آذر ۱۴۰۵ · منبع: World Gold
Council») — VLM-confirmed clean on desktop and mobile
(tests/wgc-12/13 PNGs + the two VLM JSONs); the EN toggle renders
today's exact English-only card; the fallback round-trip proven with
the DB state confirmed at every step (row deleted → the fa card
renders English verbatim with NO label, captured as
tests/wgc-14-fa-fallback-en-verbatim.png → row restored → the fa
card returns); 375px mobile with scrollWidth 375 (zero horizontal
overflow) and the footer pushed down naturally. Lint green; tsc
green for every touched file (the repo's pre-existing scripts/
bun-types noise untouched).

**Honestly NOT done — the whole Cloudflare-account-facing leg,
blocked by the dead tokens, one command each when credentials
return:**

1. **The live bake-off** (Step 1's live run): the command is above;
   the judgment re-opens the selection, and the swap is one constant.
2. **The remote D1 DDL apply**: the command is above (run twice).
3. **The wgc-watch deploy** (the [ai] binding attaches with it):
   `cd wgc-watch && CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=…
   bunx wrangler deploy` — the two cron expressions unchanged, the
   fifth trigger slot untouched. The worker's translation step then
   proves itself at the first capture with the binding.
4. **The desk worker redeploy** (the route/card changes go live):
   the two-step OpenNext runbook, NEXT_PUBLIC_BASE_PATH=/gold on BOTH
   build and deploy — the encoded mistake avoided. Until it runs,
   the live currena.ir/gold card keeps today's English-verbatim
   rendering (the designed fallback), honestly.
5. **The live forced run for 2026-10** (Step 5's deliberate
   exactly-one run — the end-to-end proof on the live account):
   `WORKERS_AI_TOKEN=… CLOUDFLARE_ACCOUNT_ID=…
   CLOUDFLARE_API_TOKEN=… bun scripts/wgc-translate-once.ts --remote
   --month 2026-10` (no --force needed — the remote D1 carries no fa
   row; the freshness gate translates straight away), then the
   sitting's own acceptance: the side-table row read back from D1
   (`wrangler d1 execute aurum-desk --remote --command "SELECT *
   FROM wgc_commentary_fa"`), the live route serving the fa fields,
   the live card rendering the Persian under the label, browser walk
   + VLM.

**The honest calendar, unchanged:** the next REAL capture is the
2026-12 issue (published early January 2027 inside the measured
window); December's watch fires are skip-month wakes (the November
target); the forced run on 2026-10 — once it runs live — is THE
end-to-end proof; the 17 historical months stay English-fallback by
default, no silent backfill; the Nov 25 09:40 UTC observation of the
watch's first fire is armed exactly as it was (this sitting touched
no schedule).

The sitting's deliverable pushed to main: the DDL extension, the
Prisma read model, the translate module, the pipeline hook, the
wrangler [ai] binding, the route's fa field, the card's fa layer, the
bake-off and forced-run scripts, the evidence PNGs/JSONs, this
record, and the spec's §8 pointer + addendum.

### The live bake-off run, the model selected, the runner swapped (2026-11-24, the credentials sitting)

The sitting that opened with the owner's fresh credentials ("Use this
credentials and continue your work") and executed the previous sitting's
deferred Step 1 — the live WGC translation bake-off — to its judgment, and
carried the judgment into the production runner. The credentials wall moved
but did not lift: each token stated first, plainly.

**The token state (verified live at open):**

- The **Workers AI token is VALID and AI-scoped** (`/user/tokens/verify`
  answers active; the account-scoped `/ai/models/search` and `/ai/run/…`
  answer; the m2m100 probe run translated live). Its scope is Workers AI
  ONLY: `/d1/*` answers Authentication error, the workers-scripts list
  answers an empty result, the cron-schedules read answers "No access to
  the specified resource", the zones list is empty. Consequence: **every
  step needing wrangler stayed blocked** — same list as before, one
  command each when a valid Workers API token arrives.
- The **Workers API token is INVALID** — `/user/tokens/verify` answers
  code 1000 "Invalid API Token" in both the given prefixed and unprefixed
  forms — the exact wall the previous sitting recorded for both of its
  tokens. The account itself is alive and serving (currena.ir/gold 200,
  the watch health endpoint answering) — the live account was untouched
  by this sitting, byte-identical to the e1af12d8→cadee2a0 state.

**The live bake-off — three runs over the FULL 2026-10 payload (headline
+ both segments), every candidate over REST under one strict JSON
contract (evidence tests/wgc-bakeoff-2026-11-24.json, three runs
recorded):**

- **Run 1 (the sitting's own script, verbatim):** m2m100 translated —
  garbled terminology («رویداد دارایی ها» for asset rotation, «متوازن
  ضعیف» for a poor parallel, «کاهش درآمد» for de-grossing) and the final
  sentence of "Looking ahead" DROPPED entirely. Two candidates
  (qwen3-30b-a3b-fp8, llama-3.1-8b-instruct-fp8) answered deprecated
  2026-11-20; six chat candidates failed "no response field" — diagnosed
  within the sitting: the newer serving shape is the OpenAI-compatible
  `chat.completion` (`choices[0].message.content`), not the legacy
  `{response}`.
- **Run 2 (the extraction fixed to read both served shapes; the candidate
  list refreshed from the LIVE account-scoped catalog — the API the
  previous sitting could not reach):** five full outputs, and two hard
  account facts: **the account is on the Workers Free plan** (deepseek
  v4.1 and glm-5.3 answered "not available on the Workers Free plan")
  and the catalog now serves the **zai-org GLM family** (glm-5.3
  paywalled; glm-4.7-flash free-plan). qwen3.8 bled English months into
  the headings («مرور October»); llama-4-scout left the headline and both
  headings in English.
- **Run 3 (the uniform `max_tokens: 2048` envelope added — gpt-oss's
  default 256-token completion budget vanishes into its reasoning
  channel, `content: null`, finish_reason "length", diagnosed live
  against the account's own serving):** eight of eleven candidates with
  full outputs.

**The judgment (the sitting's own criteria — fluent Persian, correct
gold-market terminology, no English bleed-through, numbers preserved, no
hallucinated additions): TRANSLATION_MODEL is now
`@cf/google/gemma-4-26b-a4b-it`.** The strongest translation observed:
«تحلیل بازار طلا: کف قیمت کجاست؟» (the headline's floor rendered as the
market term), «مرور اکتبر» (the correct idiom for "October in review" —
several others missed it), asset rotation → چرخش دارایی‌ها, interim
bottom → کف موقتی, downturn → رکود, recovery → بازیابی قیمت طلا, every
heading Persian (only the contract-preserved named entities such as Fed
stay), numbers preserved, and COMPLETE — the sentence m2m100 dropped
rendered in full. The incumbent m2m100 was the WEAKEST observed candidate
— exactly the fluency weakness the original selection record predicted,
plus a content loss it did not. Runner-up: gpt-oss-120b (needs the
max_tokens envelope; its 20b sibling drifted a sentence's meaning).
llama-3.3-70b: solid, consistent, weaker headline word («نظرات»).
mistral-small-3.1: fluent but inconsistent run-to-run («نظریه به جلو»
for Looking ahead on one run). One honest gap: **glm-4.7-flash serves on
the free plan but its full-prompt behavior was never observed** — the
account's **daily 10,000-neuron free allocation was exhausted by the
bake-off itself** (the last attempts answered the explicit budget error);
its exclusion from the selection is a credentials-budget fact, not a
quality verdict — re-open with `--models @cf/zai-org/glm-4.7-flash`
after the budget resets. The one monthly production call is comfortably
within the daily allocation — the bake-off's eleven-candidate ×
three-run walk was the heavy consumer, not the pipeline.

**The selection carried into the production runner
(wgc-watch/src/translate.ts, rewritten):**

- **The chat contract, one call per issue:** the bake-off's own system
  contract verbatim + the issue as the user JSON + `max_tokens: 2048`;
  the dual-shape extraction (legacy `{response}` and chat.completion
  `choices[0].message.content`); the defensive parse (fences/preamble
  stripped, outermost object); the shape contract (exactly the input's
  segment count, non-empty `{heading, body}` pairs).
- **The disciplines, now per-string over the whole payload:** the
  identity check (an untranslated string — the observed llama-4-scout
  failure mode — fails the run, nothing stored), the mirror checks (a
  dropped headline answered null, an invented headline where the source
  had none, an empty content channel — the observed gpt-oss reasoning
  mode — all fail closed), the freshness gate unchanged, the failure
  discipline unchanged (log `translate-failed`, store nothing, retry on
  the next fire). The outcome type's m2m-specific `targetLang` is gone;
  the log line names the model, the contract and the string count.
- **The outer surface unchanged:** translateCommentary's signature, the
  pipeline's two hook sites, the DDL, the [ai] binding, the desk's route
  and card — all byte-identical; only the engine and its runner moved.
  scripts/wgc-translate-once.ts's REST envelope widened to 120s (the
  selected model's observed serving latency under free-plan queueing).

**The verification, all of it this sitting:**

- **The committed contract test (tests/wgc-translate-contract.ts —
  ALL 20 CHECKS PASS, evidence tests/wgc-translate-contract-2026-11-24.json):**
  the previous sitting's ad-hoc module walk, made permanent: the happy
  path (one call, the envelope verified on the recorded input, the shape
  mirrored in order, the adapter's sourceModel attributed — never
  silently), the freshness gate (zero further calls), and every failure
  discipline (failing engine, untranslated identity, shape drift, empty
  channel, dropped headline, invented headline — each: outcome failed,
  `translate-failed` logged, NO row stored), the legacy envelope, the
  re-store re-translation, and runFire with and without env.AI
  (byte-identical pre-translation behavior). Zero network — the whole
  suite runs in under a second.
- **The module against the REAL API's budget error:** the forced run on
  a throwaway archive copy with the neurons exhausted — `translate-failed`
  logged with the honest reason ("you have used up your daily free
  allocation of 10,000 neurons"), nothing stored, the English row safe.
  The live failure surface is proven, not just the mock.
- **The forced-run gate on the real archive:** `--db` without `--force`
  answers up-to-date (zero AI calls, nothing mutated).
- **The sandbox:** the route serves the fa field from the preview row
  exactly as designed; the browser walk (agent-browser): the fa card in
  fa/RTL mode — the title, the «ترجمهٔ ماشینی» label, the Persian
  segments, the captioned English original («متن اصلی به انگلیسی»), the
  whisper line (tests/wgc-15 PNG); 375px with scrollWidth 375 (zero
  overflow, tests/wgc-16 PNG); zero console and zero page errors; lint
  green over every touched file; `tsc` clean for every wgc-watch/src
  file (the repo's pre-existing scripts/bun-types noise untouched).
- **The live account, re-checked:** currena.ir/gold 200; the live
  `/gold/api/gold/wgc-commentary` serving the English-verbatim fallback
  exactly as designed (no fa field — the desk worker still carries the
  pre-translation code); the watch health endpoint ok (target 2026-10,
  row ok, both crons); currena.ir/ untouched.

**Honestly NOT done — still the Workers-API-token wall, one command
each when a valid token arrives (the runbook unchanged from the previous
sitting, plus one new fact):**

1. The remote D1 DDL apply: `bunx wrangler d1 execute aurum-desk
   --remote --file wgc-watch/ddl.sql` (run twice).
2. The wgc-watch deploy (the [ai] binding attaches): `cd wgc-watch &&
   CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… bunx wrangler deploy`
   — now carrying the gemma chat-contract runner.
3. The desk worker redeploy (the fa route/card going live): the
   two-step OpenNext runbook, NEXT_PUBLIC_BASE_PATH=/gold on BOTH.
4. The live forced run for 2026-10: `WORKERS_AI_TOKEN=…
   CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… bun
   scripts/wgc-translate-once.ts --remote --month 2026-10` (no --force —
   the remote D1 carries no fa row; the gate translates straight away).
   The WORKERS_AI token for this run is the VALID one this sitting
   verified — the moment a valid Workers API token arrives, this step
   runs, and tomorrow's reset neuron allocation covers it (today's was
   consumed by the bake-off).

**The honest calendar, unchanged:** the next REAL capture is the 2026-12
issue (published early January 2027 inside the measured window);
December's watch fires are skip-month wakes; the forced run on 2026-10 is
THE end-to-end proof when the token arrives; the 17 historical months
stay English-fallback by default; the first live gemma capture happens on
the watch worker only after step 2 deploys the [ai] binding.

The sitting's deliverable pushed to main: the swapped translate module,
the bake-off script's shape/envelope/catalog fixes, the forced-run
envelope, the committed contract test, the bake-off/contract/forced-run
evidence JSONs, the two browser PNGs, and this record.

### The token wall falls, the translation deploys, the TE spec proposed (2026-11-24, the deploy sitting)

The sitting opened with the owner's fresh token trials — three invalid
or mis-permissioned strings tested and rejected in open (one dead, one
IP-filtered against the sandbox egress, two Workers-scoped rolls of the
same permission record) — and then the valid, fully-permissioned token
(`cfut_dHC…`: the Workers scripts, D1 read/write, the zone, and the
Workers AI permission; the AI leg itself quota-exhausted for the day
— the free plan's 10,000 neurons spent by the previous sitting's
eleven-candidate bake-off — resetting 00:00 UTC). The sitting's two
duties: close the translation sitting's every Cloudflare-account-facing
runbook that the quota does not gate, and propose the Trading Economics
daily-briefing spec the owner briefed.

**The credentials wall, closed to the quota line.** Every step the
previous sittings recorded as pending, run this sitting, in order:

1. **The remote D1 DDL apply** — `bunx wrangler d1 execute aurum-desk
   --remote --file wgc-watch/ddl.sql`, run twice: the first applied
   (rows_written 3 — the three tables), the second wrote zero — the
   idempotence proof. The read-back confirmed the three `wgc_*` tables
   in the live `aurum-desk`, `wgc_commentary_fa` empty (awaiting the
   first translation).
2. **The wgc-watch deploy** — `bunx wrangler deploy` from `wgc-watch/`:
   version 4b2ff333, the **[ai] binding attached** (env.AI beside
   env.DB, wrangler's own binding table), both cron expressions
   unchanged and re-confirmed attached, the workers.dev URL live, the
   health endpoint answering (target 2026-10, row ok). The worker now
   carries the gemma chat-contract runner live.
3. **The desk worker redeploy** — the two-step OpenNext runbook,
   NEXT_PUBLIC_BASE_PATH=/gold on BOTH (`worker:build` then
   `worker:deploy`; the dev server paused around the build, restarted
   and re-verified after): version 1ca70956. Live checks: currena.ir
   200 untouched, currena.ir/gold 200, the live
   `/gold/api/gold/wgc-commentary` serving the English row exactly as
   designed — the fa field absent until the first live translation
   lands (the designed fallback, now one quota-reset away).
4. **The live forced run for 2026-10** — quota-gated, NOT run this
   sitting: **armed as scheduled job 546599 at 2026-11-25 00:20 UTC**
   (20 minutes after the reset), carrying the exact runbook — the
   glm-4.7-flash honest-gap bake-off first, then the forced run, the
   fa-row read-back, the live-route fa verification, and the honest
   report. The watch's own Nov 25 09:30 UTC fire runs the translation
   pre-step as the natural backup (stop-on-success + retry-pre-step:
   an already-translated row answers up-to-date, zero AI calls).

The translation work is therefore wrapped to the quota line: every
deployable, verifiable leg is live; the one remaining leg is scheduled,
idempotent, and self-observing. Nothing incomplete remains except the
quota itself.

**The sandbox re-sync, stated**: this fresh sandbox carried the latest
tree (verified byte-identical to origin/main over the whole source —
src, wgc-watch/src, scripts, docs, prisma, public) minus the three
root deploy files (README.md, open-next.config.ts, wrangler.jsonc),
restored from origin/main before the desk deploy; the local git
metadata is the sandbox's own snapshot lineage, not the repo's — the
tree comparison against a fresh clone of origin/main is the ground
truth, recorded here so the next sitting does not re-derive it.

**The Trading Economics daily-briefing spec** (the owner's new brief,
this sitting's second duty — `docs/te-daily-briefing-spec.md`,
Status: proposed; implementation next session). The research, all of
it live:

- **The briefing identified precisely**: the gold page's top
  News Stream item — the owner's pasted `h2#description` body is
  **byte-identical** to the top item's `comment more` body (939 chars
  today, full text, no truncation despite the class name), and the
  pasted title is the item's own `<a>` heading; the item's detail page
  (`/commodity/gold/news/{id}`) carries the authoritative Article
  JSON-LD (headline, datePublished, author). One source of truth, two
  cross-checks.
- **The Worker-side fetch proven** — the feasibility question this
  source turns on (TE sits behind Cloudflare's own edge): a one-off
  probe worker (`currena-te-probe`, read-only, no bindings, deleted
  after the evidence) fetched the page from the Workers egress twice —
  **200, the full 443 KB page, the briefing present, no challenge,
  ~210–275 ms HKG**. The evidence JSON records both invocations; the
  account's worker list is exactly as it was.
- **The cadence measured**: the stream exposes exactly the latest three
  items — two published Nov 23 (01:53, 14:46 UTC), one Nov 24 (02:17
  UTC): **1–2 briefings/day**, an Asia-morning piece and an intraday
  second piece. The design: one cron trigger (the account's **last
  free slot** — 4/5 used today: api's every-minute, markets' covering
  trigger, wgc-watch's two) firing twice daily `0 5,16 * * *`, each
  fire one page GET plus one detail GET per genuinely new item.
- **The license read**: the page's own Dataset JSON-LD declares
  `isAccessibleForFree: true` and **CC BY 4.0** — recorded as a
  favorable signal; the discipline stays the WGC one (a verbatim
  excerpt, visible attribution, the canonical link; comes down if TE
  objects).
- **The pipeline**: a sibling minimal worker `currena-te-watch`
  (zero-deps, the same aurum-desk D1 + [ai] bindings, a health
  endpoint, `te-watch/` in this repo), three additive D1 tables
  (`te_briefing`, `te_briefing_fa`, `te_scrape_log`), a read-only
  `/gold/api/gold/te-briefing` route, and a card on the Persian page
  under the Market Brief — **the same gemma engine and the same
  disciplines** (the freshness gate, the identity/mirror checks, the
  fail-closed failure law, the «ترجمهٔ ماشینی» label) in a sibling
  module with the TE-shaped strict contract `{"headline","body"}`.
- **The clarifying questions asked in open with suggested defaults**
  (spec §11): the capture scope, the cron-slot trade-off (5/5 full
  after this), the seed depth, the cadence, the card placement, the
  bot-protection posture.

The sitting's deliverable pushed to main: this record, the TE spec
(`docs/te-daily-briefing-spec.md`), and its evidence
(`docs/evidence/te-gold-census-2026-11-24.json` — the stream verbatim,
the probe results, the license fields, the cron inventory). The
deployed state (both workers, the D1) carries no new commit — the deploys
ran origin/main's own tree as it stood.

### The TE spec decided, the translation wrap-up verified from the live state, the dead cron re-armed (2026-11-24, the deciding sitting)

The owner answered all six of the TE spec's §11 clarifying questions the
same day they were asked — every answer confirming the suggested default
the spec was written against (briefing-only scope; the fifth cron slot
taken; the three-item seed; two fires on one trigger; the card under the
Market Brief; the no-arms-race bot posture). The spec's status header now
reads **DECIDED**, §11 carries the answers verbatim, and the plan adjusts
nothing — the implementation sitting is unblocked, `docs/te-daily-briefing-spec.md`
§12's runway is the work list.

The sitting verified the translation wrap-up from the live state, not
just the source (the owner's explicit ask — the same engine serves the
TE briefing's Farsi):

1. **The engine is complete and deployed**: `wgc-watch/src/translate.ts`
   carries every discipline (the gemma chat contract, `max_tokens: 2048`,
   both served response shapes read defensively, the per-string
   identity/mirror checks, the hash-keyed freshness gate, the
   fail-closed failure law), wired at both pipeline call sites (the
   fire-top retry pre-step and the post-store step) in the deployed
   worker v4b2ff333 with the `[ai]` binding attached; the desk route
   serves the additive `fa` field fail-closed-to-absent.
2. **The live D1 state isolates the blocker to the quota alone**:
   `wgc_commentary_fa` is empty; the 17-issue English backfill stored
   01:26 UTC Nov 24; the target month 2026-10 is `ok` with its content
   hash waiting — no incomplete code, no missing wiring, no failed
   translation. The day's 10,000 neurons died mid-bake-off before the
   first live translation could run (quota still exhausted at 15:52 UTC;
   resets 00:00 UTC Nov 25, 03:30 Tehran).
3. **The TE path re-probed live**: the commodity page answered 200, no
   challenge, the top stream item still 603757 with `h2#description`
   present as the cross-check — the structure matches the census; §12.1's
   probe-first gate is pre-verified (the implementing sitting still
   re-runs it, as the gate demands).

Two close-out findings, both fixed or stated:

- **A fresh Workers-AI-scoped token pasted at close was INVALID** — the
  token-verify endpoint answered code 1000 twice (the original handoff
  token's failure mode again) while the keeper `cfut_dHC…` verified
  active as the control. The keeper remains the only valid token; if a
  dedicated AI token is wanted, it needs a careful re-paste.
- **The armed 00:20 UTC forced-run job was dead on arrival** — its
  epoch-millis schedule parsed as seconds (`next_run` year 58869, the
  same defect the watch-observation job's re-arm documented). Deleted
  and re-armed as one_time `2026-11-25 00:20:00` UTC, payload verbatim
  (the glm-4.7-flash honest-gap check, then the forced 2026-10 run, the
  fa-row read-back, the live-route fa verification). The watch's own
  Nov 25 09:30 UTC fire is the natural backup under stop-on-success.

The sitting's deliverable pushed to main: this record and the DECIDED
spec edit. The next session opens with the §12 runway: first verify the
2026-10 fa row landed (the forced run or the 09:30 fire), then re-run
the TE probe, then build `currena-te-watch` — parser harness, clock
walk, DDL twice, deploy, seed, live card.

### The TE daily-briefing pipeline built end to end, the flash-item discovery shipped inside it (2026-11-24, the implementing sitting)

The sitting opened on the §12 runway (the DECIDED spec, the owner's six
§11 answers all confirming the defaults) with the brief's two pre-flight
gates: the WGC 2026-10 fa verification and the TE re-probe. Both answered
honestly: the live D1's `wgc_commentary_fa` is still empty (the quota
gate — the armed 00:20 UTC forced-run job 546695 and the watch's own
09:30 UTC fire carry it; the live route serves the English row exactly
as designed), and the commodity page re-answered 200 with the census
structure intact — carried live into this sitting's harness re-run
(Phase A, all 13 checks green at 16:19 UTC by the previous context
window; re-verified again after the refinement below).

**The offline proofs landed first** (the previous context window's
work, re-verified this sitting): the parser harness (Phase A census
diff + B negatives + the 8-fire clock walk + D idempotence — 39 checks
green), the translate contract test (17 checks — the gemma chat
contract, the identity/mirror/shape disciplines, both served response
shapes, the re-store gate), and the DDL's local idempotence twin.

**The live legs, in order:**

1. **The remote D1** — `bunx wrangler d1 execute aurum-desk --remote
   --file te-watch/ddl.sql` twice: run one wrote 8 rows (the three
   `te_*` tables, `num_tables` 10), run two wrote zero — the
   idempotence proof, the read-back confirming `te_briefing`,
   `te_briefing_fa`, `te_scrape_log` live beside the `wgc_*` family.
2. **The worker** — `currena-te-watch` deployed from `te-watch/` with
   both bindings attached (env.DB aurum-desk, env.AI) and the cron
   `0 5,16 * * *` live — the account's fifth and LAST free cron slot
   (5/5, stated plainly). The health endpoint answers on its
   workers.dev URL. Version cbe157cd; redeployed c8cea117 after the
   flash-item refinement below.
3. **The read models** — the Prisma schema gained `TeBriefing`,
   `TeBriefingFa`, `TeScrapeLog` (the DDL's own shape, read-only for
   the desk); `db:push` applied them to the sandbox archive and
   regenerated the client.
4. **The route** — `/gold/api/gold/te-briefing` (and `?id={news_id}`),
   the WGC route's own shape: flat §6 fields, the additive always-fresh
   `fa` object (hash-keyed, fail-closed to absent), `waiting` with the
   next fire named, `structure_alert` with the last known good beside,
   the trailing `fetchFailed` streak additive on any state, and
   `coverageSince` — the record-basis floor.
5. **The card** — `te-card.tsx` in the WGC card's own visual family,
   placed in the hero column between the Market Brief and the WGC
   monthly card (the owner's Q5 answer: the daily voices together, the
   monthly below). The bilingual chrome («خلاصهٔ روزانهٔ بازار طلا» +
   EN subtitle), the fa mode's «ترجمهٔ ماشینی» pill over the primary
   RTL Farsi with the English original captioned below, the 11px
   whisper meta with the Persian calendar in fa mode («انتشار: ۳ آذر
   ۱۴۰۵»), the honest states (waiting names the next fire, the
   fetch-failed streak, the alert), and the record-basis line («سابقهٔ
   ثبت از ۲ آذر ۱۴۰۵ آغاز می‌شود…»).

**The flash-item discovery — the sitting's own §12.1 moment.** The
first seed run (16:50 UTC) answered `structure-alert: the top item's
body is 37 characters` — the live stream had rotated a PRICE FLASH onto
the top slot (id 604014, "Gold is down by 2%", body "Gold decreased 2%
to 3562.37 USD/t.oz"), pushing the briefing 603757 to second and
603349 out of the 3-slot window. The previous context window had
already recorded the census addendum (16:25 UTC) with the designed
consequence; this sitting verified every claim live and implemented it:

- The h2#description still carries the TOP BRIEFING's body (939 chars,
  byte-identical to 603757) — the flash does not move it.
- The detail pages carry the article's own full body in their
  `<meta name="description">` — verified byte-identical to the stream
  copy for 603757 (939) and matching the census fingerprint for the
  rotated-out 603349 (948, first+last) — the rotation-proof source the
  parser now reads (`detailBody`, order-insensitive, entity-decoded).
- `BRIEFING_BODY_FLOOR = 200` + `briefingItemsOf()` define the capture
  scope (the owner's Q1: "just the box of briefing + title"): flash
  items are skipped — never stored, never fetched, never an alarm —
  and the page gates carry the addendum's three reactions (all-flash +
  no real h2 → the login alarm; all-flash + real h2 → the quiet fire;
  briefings + h2 mismatch → template drift). The alarm's marker key
  now targets the top briefing-qualified item.
- The clock walk grew a ninth fire (the rotated-window quiet fire) and
  the flash item rides the walk's raw top slot from fire 1 — the
  harness re-ran with **39/39 checks green** (Phase A's live diff
  included: the flash excluded, the census's in-window items verbatim,
  the rotated-out item named, the meta-description identity true).
- The first (pre-refinement) seed's misdiagnosis remains honestly in
  the remote log — one `structure-alert` line and an inert marker row
  (604014, empty body, filtered from every read path) — never revised,
  only superseded.

**The seed, twice.** The refined seed (16:59 UTC) captured the
in-window briefings 603757 + 603608 ("2 stored; 1 flash item(s)
skipped") plus the **census backstop** — 603349, rotated out before the
seed ran, fetched by its ONE detail GET and verified through the
fingerprint gates (the census's own body_chars/body_first/body_last +
the JSON-LD headline and datePublished identity) before the same
upsert: the owner's "all three" answer honored with no archive
crawling. The local archive (db/custom.db) carries the same three rows
for the sandbox preview; a re-run answers the honest quiet fire
(idempotence proven on both stores).

**The environment's own two walls, both met and fixed:**

- `bun install` (pulling the lockfile's @prisma/adapter-d1, missing
  from the drifted node_modules) bumped next 16.1.3 → 16.4.6 and
  surfaced a Turbopack panic on Tailwind 4.1.18's auto-detection glob
  (a genuinely malformed pattern — one open brace, two closes — the
  "unopened alternate group" crash). The documented fix landed in
  globals.css: an explicit `@source "../**/*.{js,ts,jsx,tsx,md,mdx}"`
  (auto-detection off, the scan scope honest — every class lives under
  src/). The page compiles clean; the dev server restarted and
  re-verified.
- A display quirk cost an hour of forensics before its nature was
  proven: the Bash tool's text output EATS the two-byte sequence `[m`
  (an ANSI-escape remnant) — a file line reading `@@index([monthKey])`
  displays as `@@index(onthKey])`, od/hex/repr telling the truth while
  sed/grep/python-repr lied. Recorded so the next sitting recognizes it
  instantly: verify byte-level oddities with the Read/Grep tools or
  od/hex, never with plain bash text output.

**The desk worker redeployed** on the two-step OpenNext runbook
(NEXT_PUBLIC_BASE_PATH=/gold on both, the dev server paused around the
build and restarted after): live checks green — currena.ir 200
untouched, currena.ir/gold 200, the live
`/gold/api/gold/te-briefing` serving status ok with the real briefing
(603757, 939 chars, author Jam Kaimo Samonte) and `coverageSince`
2026-11-23T01:53:00Z; the full route set stays green (wgc-commentary
200, rates 200, meter/daily 400-by-design param-required, 200 with a
date); the WGC route's English-only state unchanged beside it.

**The browser walk (agent-browser, the sandbox preview):** EN mode —
the card's bilingual header, the briefing's own headline, the meta
line (Published November 24, 2026 · fetched · Source: Trading
Economics), the coverage line, no label (no stored Farsi — the honest
interim). FA mode — «خلاصهٔ روزانهٔ بازار طلا» primary, the English
verbatim in the LTR block with no fake translation, the Persian
calendar meta («انتشار: ۳ آذر ۱۴۰۵»), the record-basis line in
Farsi. 375px: card width 351, zero horizontal overflow, zero clipped
elements. Dark mode captured. Zero console errors, zero page errors.
Placement verified in the DOM: PriceCard → gold-briefing (Market
Brief) → **gold-te-briefing** → gold-wgc. Two PNGs recorded
(te-01-card-fa-mobile375, te-02-card-fa-dark-desktop).

**The quota dependency stated plainly (§12.7):** the sitting landed
BEFORE the daily neuron reset — the translation legs wait for it, each
one scheduled and self-observing: job 546784 (2026-11-25 00:40 UTC,
epoch-millis armed after the scheduler's timezone parse quirk) runs
the seed's translation pass over the live D1 (three gemma calls, the
same engine the worker carries), reads back the fa rows, and verifies
the live route's additive fa object; job 546785 (05:30 UTC) observes
the watch's FIRST real fire (05:00 UTC, the Asia-morning capture) and
records it. The watch's own fires cover every leg redundantly after
that (the pre-step translates one stored-but-untranslated row per
fire). The WGC 2026-10 translation rides its own armed job 546695
(00:20 UTC) — one allocation, four scheduled consumers, the honest
order.

The sitting's deliverable, pushed to main: the refined parser and
pipeline (the flash-item scope), the seed's census backstop, the
harness's ninth fire and re-verified 39-check evidence, the contract
test's clean re-run, the Prisma read models, the desk route, the card
and its bilingual copy, the page placement, the globals.css source
fix, the seed evidence (six runs — the alarm, the refined captures,
the idempotence re-runs), and this record.

**Honestly NOT done, all quota- or clock-gated, all armed:** the three
fa translations (00:40 UTC job), the first real fire's observation
(05:30 UTC job), the live card's Persian rendering (rides the
translations), and the WGC fa row (its own 00:20 UTC job). Nothing
else remains — the pipeline is complete, deployed, and verified to the
quota line.

### The owner's nine UI refinements, shipped end to end (2026-11-25, the polish sitting)

The owner reviewed the live gold page and asked for nine refinements —
all shipped, browser-verified in both locales, deployed, and pushed:

1. **The Market Brief grew a live price-position line** — the owner's
   ask: "more complete, it doesn't mention the 15-month retrace." The
   takeaway's conditions sentence and balance close stay the reviewed
   copy; beneath them a second line now composes LIVE from the page's
   own verdicts — the history echo (the 15-month retraction, only in
   its return mode), the 200-day distance (the TA leg's own reading)
   and the YTD / 1-year windows (the SAME trend-all query the briefing
   card runs — one cache, one fetch). Each clause present only when
   its leg actually arrived; fail-closed to absent, never a guess.
   fa composes with «؛» joiners and the trailing «است»; EN with
   semicolons. Verified live text: «قیمت به حدود ۱۵ ماه پیشِ خودش
   بازگشته است؛ ۱۴٫۷٪ پایین‌تر از میانگین ۲۰۰ روزه‌اش ایستاده؛ از
   ابتدای سال میلادی ۱۸٫۸٪ پایین‌تر و در یک سال گذشته ۱۴٫۷٪
   پایین‌تر است.»
2. **The briefing trend table's hierarchy flipped** — the PERCENT is
   now the number (SignedDelta grew a `big` variant: 15px extrabold),
   the then→now price path whispers beside it (11px, tertiary ink,
   75% opacity, no bold), and the rows breathe (py-2.5 + gap-y-1).
3. **whyTitle renamed**: «فاکتورهای تاثیرگذار بر قیمت طلا» →
   «فاکتورهای شاخص تاثیرگذار کنونی» (EN: "Key factors at work
   right now").
4. **The TE card's chrome de-bilingualized** — the owner's words:
   one language, one title. «خلاصهٔ روزانهٔ بازار طلا» is now a real
   h2 (1.25rem extrabold) in fa mode, the English title in EN mode;
   the mirrored subtitle, the seriesLine («خلاصهٔ خبری صفحهٔ طلا…»)
   and the coverage note («سابقهٔ ثبت از ۲ آذر…») are gone from both
   bundles and both interfaces. The honest states and the meta line
   (with the Trading Economics link) ride the card unchanged.
5. **The WGC card, the same treatment** — «نگارش ماهانهٔ شورای جهانی
   طلا» as the single-language h2; the subtitle, seriesLine and the
   pre-box note («جعبهٔ هایلایت‌ها از شمارهٔ مارس ۲۰۲۵…») removed.
   And the brass balance's stress pan now reads «تنش بازار» (the
   short lane label, EN "market stress") — the owner's precision on
   what "تنش" meant.
6. **The scenarios' outcome rows lost their red/green washes** — the
   tinted backgrounds are gone; the colour rides ONLY on the «طلا
   بالا» / «طلا پایین» chips (verified: 0 tinted divs, 10 chips).
7. **The calendar's description became 1:1** — the owner's ask: the
   text must name exactly what the calendar lists. The subtitle is
   now BUILT from the very same `events` array the rows render
   (distinct kinds, joined «، … و …» / ", … and …"), the header chip
   carries the same kinds compact (EventDef grew a `short` label),
   and the merged expectations leg's entries join the same list.
   Live fa: «ادعای بیکاری، گزارش اشتغال آمریکا (NFP)، شاخص PCE …،
   تصمیم نرخ فدرال رزرو (FOMC)، تورم آمریکا (CPI)، … و رشد
   اقتصادی آمریکا (برآورد اولیه).» — never a second hand-written
   list that can drift.
8. **The alternatives graph doubled** — TraceChart grew a
   `responsive` mode: the canvas width follows the container
   (clamped 320–640, ResizeObserver, SSR-safe default 640, pads
   absolute so labels never leave the frame). On a 375px phone the
   compare chart now renders 319×299 (was 319×115 — text, strokes
   and height all ~2×), with height 300; on desktop 976×458, zero
   overflow either way.
9. **The TA concepts moved behind one expandable** — the three
   plain-language facts (میانگین ۲۰۰ روزه…، تلاقی طلایی…، فیبوناچی…)
   hide behind the «مفاهیم پایه به زبان ساده» toggle button
   (aria-expanded + aria-controls, the house pattern), verified
   open/close in the browser.

The sitting's own honest findings, stated: the shell heredoc EATS
Persian text (the known quirk — python scripts written through the
file tools, never bash heredocs, for copy edits), and one edit
ordering slip (a memo referencing `ta` before its declaration) was
caught by the browser's ReferenceError and fixed before anything
shipped. Lint clean; the dev log clean; the browser walk: zero page
errors, zero console errors, fa + EN, 375px (351px cards, zero
overflow), dark mode, desktop 1280 (976px chart, zero overflow).
Four evidence PNGs recorded (owner-feedback-fa-mobile375,
owner-feedback-fa-dark-top, final-fa-market-brief, final-fa-te-wgc,
final-fa-compare).

**Deployed** on the two-step OpenNext runbook
(NEXT_PUBLIC_BASE_PATH=/gold on both, the dev server paused around
the build and restarted after): currena-gold-desk version
3c2d76ae-ca08-4afe-84c2-73aae7f1a1b5. Live checks green: currena.ir
200, currena.ir/gold 200, the te-briefing and wgc-commentary routes
200 with their real payloads; the served HTML carries the new copy
(the old-only strings — "Explore the five forces", the te seriesLine,
the wgc pre-box, the hand-written calendar list — all gone).

The quota note stands as the owner stated it: the daily and monthly
reports' Latin bodies are temporarily accepted while the AI workers
quota resets; the fa layers ride their armed jobs exactly as before.

### The real-yield re-sourcing, spec-first (2026-11-25, the FRED yields sitting)

The owner's brief named a correctness bug, not a gap: the gold page's
"Real 10y" card showed **4.92% — the DGS10 NOMINAL yield** — under the
label "Real 10y yield" / «بازده واقعی ۱۰ساله», because the observation
store's `realYield` dataset was EODHD `^TNX` (the registry's own note
admitting the proxy). The true 10-year TIPS real yield that day:
**2.79%** (FRED DFII10). The sitting replaced the proxy with the truth,
added the nominal beside it, and shipped the pair honestly labeled —
spec-first, per the house law.

**The spec and the evidence first** (`docs/fred-yields-spec.md` +
`docs/evidence/fred-yields-census-2026-11-25.json`, regenerable with
`bun scripts/fred-probe.ts`): both FRED series serve as CSV with no
key, no registration, no quota (header `observation_date,<SERIES>`,
`&cosd=` trim verified); DFII10 (TIPS real, from 2003) and DGS10
(nominal, from 1962) share an identical value-bearing calendar; the
grid math answered the intersection risk the brief named — the FRED
bond calendar drops exactly Columbus Day and Veterans Day from the
common grid, **251 → 249 trading days, comfortably above
MIN_LIVE_DEPTH = 200**, the EODHD 380-day window stays the binding
constraint, no `cosd` widening needed; the cron inventory confirmed
5/5 triggers (no new cron — the sync rides the pull-on-render gate);
both series pages carry "Public Domain: Citation Requested" (Board of
Governers H.15 via FRB St. Louis — freely redistributable with
attribution).

**What was built:**

- **`src/lib/gold/sources/fred.ts`** — the sibling source module:
  `FRED_SPECS` (realYield → DFII10, nominalYield → DGS10), one small
  CSV GET per series over a 400-day window with the identified UA, the
  same delete-then-create storeObservations + upsertSync discipline,
  its own once-per-UTC-day gate, never throws (error → the honest
  engine-modelled path, no proxy fallback exists).
- **`eodhd.ts` re-sourced** — the `realYield` dataset key KEPT (no
  engine ripple: the builder text, the correlations, every downstream
  fact keep their shape; only the bytes behind the key became true),
  symbol "FRED DFII10", mode `live`; `nominalYield` ("FRED DGS10")
  added to the `MarketDataset` union, `SOURCE_REGISTRY`, and
  `getGroundedBundle()`'s dataset list; the ^TNX entry deleted (grep
  clean); `SourceSpec` gained `source: "eodhd" | "fred"`; and
  `ensureObservations()` became the orchestrator over both legs.
- **The daily gate fixed to registry coverage** — the old
  every-row-stamped-today gate would have skipped the sync forever
  once old rows exist and a NEW dataset joins the registry (the exact
  trap this sitting set); each leg now gates over its own specs.
- **`/api/gold` gained `nominalYield` + `chg1d`** (the daily change in
  percentage points — a rate's honest unit, the compare band's own
  law) **and the pull-on-render sync trigger**: the gold page calls no
  desk route, so without its own trigger the yield cards would have
  served the ^TNX-era rows until some desk visitor synced. The first
  render of the day syncs (2 FRED GETs + the gated EODHD leg); a
  failure logs and serves the store, the as-of lines state what they
  hold.
- **The bug the verification itself caught**: FRED's bond-market
  holidays print as date-only rows with an **EMPTY value cell** —
  `Number("") === 0`, finite — so both FRED parsers (the new source
  module AND the compare leg's, live since 2026-11-23) would store
  0-close rows (12 in the trailing window). Guarded in both; the
  byte-level evidence (`2025-11-27,\n`) is in the census.
- **The UI**: the dashboard's two side-by-side yield cards —
  "10Y Real Yield (TIPS)" / "10Y Nominal Yield" («بازدهی واقعی ۱۰
  ساله» / «بازدهی اسمی ۱۰ ساله») — each with the level, the daily pp
  change (`PpDelta`, zero renders signless/neutral per the compare
  scorecard's own law), the spark, and the provenance caption
  "FRED · daily close · as of {date}" («FRED · قیمت پایانی روزانه ·
  تا {تاریخ}», the Persian calendar in fa); the derived **10y
  breakeven** whisper beneath (DGS10 − DFII10 = 2.13%, only when the
  pair shares its FRED calendar day); the compare band's **opt-in
  nominal line** (default off, right axis at the true % level, pp
  scorecard row, never in the best/worst contest) and the band's
  source note now actually rendered, naming FRED DFII10 + DGS10.

**Verified before the push:** the 7/7 harness (`scripts/fred-verify.ts`
— the bundle grounds with **249 common trading days and all seven
datasets live**, the grid-aligned values are the true closes, the
breakeven true); the browser walk EN + fa/RTL (Persian digits and the
Persian calendar date «۲ آذر ۱۴۰۵»), dark mode, 375px (scrollWidth 375,
the pair 319px, zero horizontal overflow), zero console and zero page
errors; the same-day second `/api/gold` call answers in 86 ms with the
gate skipping (0 FRED GETs); lint green; `tsc` introduces no new
errors (the base tree's pre-existing noise is byte-identical).

**Deployed** on the two-step OpenNext runbook
(`NEXT_PUBLIC_BASE_PATH=/gold` on BOTH build and deploy — the encoded
mistake avoided) and live-verified at https://currena.ir/gold: the
**live D1 re-sourced itself through the pull-on-render sync on the
first request** (273 + 273 value-bearing rows, zero empty-cell zeros,
both SourceSync rows live at 2026-11-23, the ^TNX rows swapped out
wholesale); the live cards read **2.79% real / 4.92% nominal** with
+0.02pp / 0pp and the 2.13% breakeven — re-checked against fresh FRED
fetches at verify time (2026-11-23 = 2.79 / 4.92, the same day); the
live compare payload carries both 5-year legs (−1.01 → 2.79 real,
1.43 → 4.92 nominal — the true 2021 lows); the full route sweep green
(every `/gold/api/gold/*` and `/gold/api/desk` 200, meter and daily
with their dates; `currena.ir/` and `/goldsmith` still serving the
converter untouched); the live fa/RTL walk, dark mode, 375px and the
zero-console walk re-run against the canonical URL; the second
same-day live call answers in 0.5 s (the gate held — zero FRED GETs).

**Honest notes, stated:** the desk's cached DeskDay rows keep their
own days' numbers (cache-first, the designed law — a pre-re-sourcing
row honestly records what was served that day); the next UTC day's
build (or a regenerate) picks the true real series up through the
engine seam, and `/api/desk`'s provenance then lists both FRED
datasets — at verify time the route served a cached modelled-era row.
The dead `market-strip.tsx` (the old desk page's strip, zero
importers, no yield label) stays untouched. The EODHD token path is
untouched and one EODHD daily call is saved (realYield no longer
consumes it). No new cron trigger (5/5 stays), no D1 migration, no
seed re-run, secrets untouched.

### The owner's twenty refinements, batch H (2026-11-25, the same sitting)

The owner's twenty-item pass, one tree, deployed the same hour — the
batch-D/F/G pattern. Every item browser-verified on the dev server
(fa + EN) before the build and re-verified against the live canonical
URL after the deploy; the full walk: fa/RTL and EN, dark, 375px
(scrollWidth 375, zero horizontal overflow), zero console and zero
page errors in a fresh context, lint green, and the one true bug
reproduced before being fixed.

1. **The vague lines removed**: the market summary's
   «ترازو علیه می‌چرخد؛ شرایط، نه پیش‌بینی» close, the trend table's
   «از یک روز تا پنج سال…» note, the balance header's «سابقهٔ شرایط»
   record line (both its renders — the balance and the takeaway
   header — plus the now-dead copy keys), the scenarios' «سناریوها»
   eyebrow, and the «فهرستی از پیچ‌هایی…» note.
2. **The price chart direction-inked**: green when the selected window
   rises, a red that DEEPENS with the fall's severity
   (`directionInk` — a color-mix ladder from a muted brick at −1% to
   the full alert ink at −8% or worse), the house gold when flat or
   unread; and the header's liveness dot now BREATHES (the
   `cr-breathe` keyframes, guarded by the global reduced-motion rule)
   in the same direction ink.
3. **The balance's pans carry their side's ground**: the bowls' fill
   raised from an 8% to a 16% color-mix of the green/red status inks —
   the containers themselves say which pan is which.
4. **The scenarios intro rewritten in the owner's own framing** (their
   Persian draft, polished, with a parallel English): the world's
   major economic decisions — steered by the U.S. Treasury, central
   banks and statistical agencies — move the gold price; the events
   ahead are listed here, some with fixed recurring dates, others
   periodic or conditional and adopted unannounced.
5. **The scenarios and the calendar MERGED into one card**
   («سناریوهای تغییر قیمت»): the scenarios above, «چه چیزی در راه
   است» as the calendar's sub-heading below, the institutions chip and
   the 1:1 kinds line kept, the construction note kept as the card's
   footnote — the events ARE the scenarios' own dates; the separate
   calendar section, its nav item, and the duplicated framing are gone.
6. **The compare band retitled** «بازده طلا در برابر جایگزین‌ها» / "Gold's
   return against the alternatives" (the subtitle now tells the truth
   about the right-axis yields), **six clearly different hues** (gold,
   navy, teal, slate, orange, green — no two confusable), **each
   line's name painted at its right end** in its own colour
   (TraceChart's new `lineLabels`, de-collided vertically), the
   sources line removed, and a **vertical bar view** added — one bar
   per enabled asset, the window's % change in each line's own colour,
   growing or dropping from a zero baseline (the yields never join: a
   rate's pp is not a % return).
7. **The TA levels as one row**: `[support | now | resistance]` —
   always three cells side by side (was one-per-row on phones).
8. **The central banks**: «ذخیره فعلی: ۶۹۰ تن» on every holding
   (table + mobile rows), the valuation note shrunk to a
   10.5px/70%-opacity whisper, and the reported-world line rewritten
   plain: «این شمارش فقط کشورهایی را می‌بیند که گزارش رسمی می‌دهند —
   {n} کشور، مجموعاً {tonnes} تن ذخیرهٔ رسمی؛ کل جهان اندکی بیش از این
   در نزد خود دارد» (the chart's caption chip likewise reworded to
   «کشورهای گزارش‌دهنده»).
9. **The positions verdict explained**: below «لانگ» — «معامله‌گران
   سفته‌باز بر رشد قیمت طلا شرط بسته‌اند — {قدرت}» with the strength
   graded from the reading's own ratio (heavy past ±60, strong past
   ±40, moderate otherwise).
10. **The dashboard consolidated with نسبت‌ها**: the top-3 ratios
    (طلا/نقره، قیمت واقعی طلا، طلا/نفت) are now first-class indicator
    cards in the same grid (value, 30-day delta, decade-band whisper),
    the inline gold/silver line is gone, and the expand now reveals
    only the remaining five ratios — one metrics block, no duplicated
    top-set.
11. **The currency grid's verdict**: «طلا در برابر {strong} قوی‌تر شده
    ({pct} در ۳۰ روز) و در برابر {weak} ضعیف‌تر — اونس طلا ارزِ افتاده
    را بیشتر می‌خرد و ارزِ قوی‌شده را کمتر», plus the **toman unit
    fixed**: an ounce over a billion toman reads «۱ میلیارد تومان» /
    "bn toman", never «۱٬۰۰۸ میلیون» (the scale mistake was a unit
    mistake).
12. **The wealth calculator's input bug fixed** — the owner's report:
    typing 1000 gives "0100". Root cause: a controlled `type=number`
    (the browser and React fight over the value; a cleared field
    snaps to "0" and prefixes the next digits; select-all typing
    appends — reproduced live: selecting "100" and typing "1000" grew
    to "11000"). The input is TEXT now with a sanitized mirror: fa/ar
    digits normalize to ASCII, anything but digits and one dot drops,
    leading zeros collapse («۰۱۰۰» → "100"), empty stays empty while
    typing and restores "0" on blur; the number commits underneath.
    Verified: select-all + type 1000 → "1000", clear + 500 → "500" —
    on the dev server AND the live page.
13. **The physical market and the London vault MERGED into «سایر
    شاخص‌ها»** ("Other indicators") at the page's foot — one card, two
    sub-blocks (بازار فیزیکی with its verdict box, خزانهٔ لندن و تسویه
    with its own collapse), the two nav items replaced by one «سایر»;
    the relationships map stays the page's closing view and the
    history the very last section.
14. **The relationship map is a graph now** (the owner's "still a
    list" — the list survives as the reference layer beneath): six
    family nodes around one gold hub, every edge an arrow INTO gold
    (width by documented link count, ink by the family's strongest
    evidence class), the letter chip on every node, and the two
    documented cross-links drawn dashed — R-14 (borrowing costs feed
    the dollar) and R-22 (in a true panic the dollar itself bids with
    gold). Tap a node to read its records («همهٔ خانواده‌ها» resets);
    responsive (radial on wide screens, twin-column on phones, the
    viewBox follows the container); the how-to-read line rewritten for
    the graph.

**The verification record**: every removed string grep-clean on the
live page (fa + EN), every new line present; the breathing dot's
`cr-breathe` animation and the full-severity red chart stroke both
read from the computed styles; the pan bowls' 16% tints; the merged
sections' headers and the last-three order (سایر شاخص‌ها → نقشهٔ روابط
→ تاریخ); the graph's nodes, arrows, dashed cross-links and the
tap-to-select (4 records for هزینهٔ پول); the dashboard's ten-card
grid (yields + indicators + the three ratios); the TA row's three
columns; the CB labels; the positions description with «شرطی قوی»;
the currency verdict; the toman's «۱ میلیارد تومان»; the compare
band's four bars, six hues and on-chart labels; the calculator's
fixed typing — and the route sweep green (`/gold`, every
`/gold/api/gold/*`, `/gold/api/desk`, currena.ir/ and /goldsmith
untouched). Deployed on the two-step OpenNext runbook
(`NEXT_PUBLIC_BASE_PATH=/gold` on BOTH build and deploy), live PNGs
tests/batchh-01…04.

## The tools suite — all nine tools consolidated on currena.ir/tools (2026-11-25, the tools sitting)

The owner's instruction: add the nine tools to currena.ir/tools and
consolidate everything there, improving the family over time. The
list (verbatim intent): مبدل ارز، محاسبه ثروت مرکب (already live),
محاسبه گرهای طلا as a dedicated tool that imports all gold tools onto
one page، تابلوی نرخ های لحظه ای، ماشین حساب ارزی، رسیدساز ارزی،
محاسبه دنگ، تسویه گروهی، تبدیل گروهی ارزها.

### What was built (branch feat/tools-suite, from compound-wealth 1fc1a887)

- **The consolidation seam** — `src/lib/tools/registry.ts`: ONE list of
  every tool (slug, group, bilingual title + one line). The index, every
  tool page's shell (breadcrumb + tab title) and the gold hub's nav all
  read from it; adding a tool later = one entry + one page. The groups:
  Wealth (ثروت) / Currency (ارز) / Gold (طلا) / Shared money (پول مشترک).
- **The live seam** — `src/lib/tools/rates.ts`: one client hook over the
  desk's own `/api/gold/rates` route (the currena-api snapshot: 17 FX
  rows quoted foreign-units-per-toman + 10 gold rows), 60-second poll,
  fail-closed honest states; plus the pure cross-rate helpers.
- **The eight new pages** (all under the public /tools URLs, EN + fa/RTL
  on the compound chrome, Persian digits and the Persian calendar at
  render time, mobile-first 375px, dark mode):
  - `/tools/currency-converter` — مبدل ارز: any two currencies through
    the toman, the rate and its inverse stated, quick amounts.
  - `/tools/live-rates` — تابلوی نرخ‌های لحظه‌ای: the whole board (17
    currencies in toman-per-unit with each row's own day range; all 10
    gold rows, the ounce in USD), auto-refresh every minute.
  - `/tools/currency-calculator` — ماشین‌حساب ارزی: the exchange desk's
    maths (sell to / buy from the customer, a base rate prefilled from
    the live board, a margin; the quote, the toman total and the
    desk's own margin come out — stated, never hidden).
  - `/tools/exchange-receipt` — رسیدساز ارزی: the deal form + the
    receipt preview + the print path (the digest-printing contract
    restated: body.receipt-printing, ink on white, 76mm).
  - `/tools/gold-calculators` — محاسبه‌گرهای طلا, the gold hub: ALL the
    gold tools imported onto one dedicated page (the owner's
    instruction) with an in-page nav — the value calculator (karats
    24/22/18/14/12 on live prices; 24k and 18k from their own rows,
    every other karat from the 24k row at purity ratio), the
    jewellery-invoice fold (اجرت + سود, VAT on the wage + profit only —
    the market's own rule), the mesghal ↔ grams converter on both bases
    (۴٫۶۰۸۳ g 17k / ۴٫۳۳۱۸ g 18k, the kimiadevelop/saatchi formulation,
    cross-checked against the live board: مظنه ÷ ۴٫۳۳۱۸ ≈ گرم ۱۸), the
    karat conversion (وزن × عیار مبدأ ÷ عیار مقصد), and today's gold
    board with the desk one link away.
  - `/tools/dang` — محاسبه دنگ: «دنگ کردن», the fair split. Equal mode
    is the common convention (each share = the whole ÷ the number of
    people — the capora formulation); weighted mode carries the same
    whole by per-person weights. Shares rounded for reading, the exact
    figure stated, the sum checked against the whole.
  - `/tools/group-settlement` — تسویه گروهی: expenses as paid, net
    balances, then the smallest set of transfers that squares everyone
    (greedy pairing, never more than people − 1).
  - `/tools/batch-converter` — تبدیل گروهی ارزها: several lines, one
    target (toman by default), the total.
- **The revived index** — registry-driven, grouped, bilingual; the main
  site's own converter stays linked under «از سایت اصلی» (its page
  untouched, the original spec's rule).
- **The chrome opened to the family** — chrome.tsx's prop types loosened
  to the structural `ToolsChromeCopy` (the compound pages unchanged);
  the shared atoms in `src/components/tools/atoms.tsx` restate the
  compound tool's own controls (the typing-surviving NumberField, the
  chips, the fold, the pickers).

### The verification

- `bun run lint` green; tsc clean on every new file (the repo's
  pre-existing tolerated errors untouched).
- **20/20 maths tests** (`bun test tests/tools-maths.test.ts`): the
  rates direction against the live snapshot's own convention (the API's
  USD rate is exactly 1/292,890 toman), the fair split (equal +
  weighted + the rounding), the settlement (the four-person sample's
  minimal three transfers; people − 1 bound), the gold constants (both
  mesghal bases, the live-board cross-check مظنه ÷ ۴٫۳۳۱۸ ≈ گرم ۱۸,
  the karat rule, the VAT-on-wage-only invoice), the receipt totals.
- **The browser walk** (agent-browser, the dev server on :3000): all
  ten routes 200; zero console errors, zero page errors; 375px with no
  horizontal overflow on every page; fa/RTL + Persian digits verified
  («مبدل ارز · کورنا», ۱۰۰ دلار آمریکا → ۲۹۲٬۸۹۰ تومان); dark mode;
  live data through the whole stack (converter 100 USD → 29,289,000
  toman on the exact live rate; the board 17 + 10 rows; the desk
  calculator's 1٪ margin → 295,819/29,581,890/292,890; the hub's 5 g
  18k → 127,377,500 on the live gram price; the receipt's payable
  29,289,000 with the live-prefilled rate; the settlement's «Zhaleh
  pays Nima/Arash/Sara»). Record PNGs: `tests/tools-suite/01…08`.
- **The production mounting verified on workerd** (`wrangler dev`,
  the OpenNext bundle built with `NEXT_PUBLIC_BASE_PATH=/gold`):
  /tools, /tools/dang, /tools/gold-calculators 200 through the
  worker-entry rewrite; `/gold/api/gold/rates` 200 (the production
  fetch path the tools' hook uses); /gold 200 untouched; /tools/ →
  301 /tools; /gold/tools/dang → 301 /tools/dang. The bundle is
  production-correct.

### The deploy — blocked by the token's authentication scheme (stated honestly)

The owner's fresh `cfut_` token (used env-only, never stored or
printed) verifies ACTIVE, reads the account's workers (sees
currena-gold-desk + currena-api), and is AUTHORIZED on the classic
`PUT /workers/scripts/{name}` endpoint (a probe passed authz into
module validation) — but the **versioned upload** that wrangler 4.166's
deploy performs (`PUT /accounts/…/workers/services/{name}`) is rejected
with `10405 — Method not allowed for this authentication scheme` (and
`10000` on the real run). The assets-upload-session endpoint accepts
the token; the classic script upload accepts the token; only the
services/versioned write refuses this scheme. The previous deploys
ran on a token that the services endpoint accepted.

**What is needed to ship the bundle** (it is built and
production-verified in `.open-next/`): an API token the versioned
upload accepts — the “Edit Cloudflare Workers” template (Workers
Scripts: Edit + Workers Deployments: Edit + D1: Edit + Zone → Workers
Routes: Edit for currena.ir + Account Settings: Read) — then the
runbook verbatim:

```
NEXT_PUBLIC_BASE_PATH=/gold CLOUDFLARE_API_TOKEN=<token> \
  CLOUDFLARE_ACCOUNT_ID=5f123468027e4b2094167df1d2f2e852 \
  bun run worker:deploy
```

(The build step is already done and green; only the deploy fires.)

Nothing on the live site was touched: currena-gold-desk continues
serving the previous deploy; currena-api untouched; the routes
(currena.ir/tools and /tools/*, already claimed) will serve the new
pages the moment the bundle lands.

### The close-out

- Pushed to **feat/tools-suite** (never force main — the programme
  convention).
- The next session's copy-paste prompt: “The tools suite is on
  feat/tools-suite, browser-verified and workerd-verified, with
  `.open-next/` built. Deploy it: the runbook is at the end of the
  tools-suite record in AGENTS.md — it needs a token that the
  versioned upload accepts (the Edit Cloudflare Workers template).
  Then live-verify currena.ir/tools (all nine cards) and each tool
  page in fa + EN, dark + 375px, zero console errors, and append the
  deploy record here.”

## The tools-suite deploy record — the new token passes the versioned upload; currena.ir/tools is live (2026-11-25, the deploy sitting)

The owner's next token (used env-only, never stored or printed) does
what the record above asked: it verifies ACTIVE, reads the account's
workers AND the services endpoint, and — the gate that mattered — the
**versioned upload accepts it** (`opennextjs-cloudflare deploy` →
`PUT /accounts/…/workers/services/currena-gold-desk`), the exact
call the previous `cfut_` token failed with `10405`.

### Deploy 1 — the tools suite ships

Version `63306026-089a-4ce2-9010-3dd65cbb4696` on currena-gold-desk
(routes currena.ir/tools and /tools/* now serve the nine tools;
/gold untouched). The live walk:

- All twelve routes 200: /tools, the nine tool pages, /gold, and
  /gold/api/gold/rates (the production fetch path the tools' hook
  reads).
- The index shows all nine cards, grouped Wealth / Currency / Gold /
  Shared money, in EN and fa (every Persian name exactly as the owner
  wrote it), dark mode, and 375px with no horizontal overflow.
- Every tool page: correct title, zero console errors, zero page
  errors, no 375px overflow.
- Live data end to end: the converter 100 USD → 29,289,000 toman on
  the stated rate 292,890 (inverse stated too); the board USD
  292,890 / EUR 321,800 with each row's day range and the last-read
  timestamp; the gold hub 5 g 18k → 127,377,500 toman, the mesghal
  cross-check (110,354,822 at the live gram price vs the live quote
  110,345,000 — 0.009% apart), karat 10 g 18 → 7.5 g 24 worth
  254,752,500; the settlement's sample (1,500,000 among 3 → per head
  500,000, two minimal transfers); the receipt's form + preview +
  print path; the desk calculator's base rate prefilled from the live
  board (Source: 292,890); the batch converter's holdings + one
  target.

### The improvement the walk found — dang's exact figure, promised but never rendered

The dang page's own copy said «the exact split is shown beside each
share» — but the UI never rendered `exact`; only the rounded share
appeared. Fixed: the exact figure now renders under each share
(EN «exact: 333,333.33», fa «دقیق: ۳۳۳٬۳۳۳٫۳۳», Persian digits), and
the line is hidden when rounding loses nothing (a 2-way split of
1,000,000 shows a clean 500,000 with no hint). The strong line now
says "The exact split covers the whole" — coherent with the
sum-of-rounded line beside it. Lint green, tsc clean, the 20/20
maths tests green; dev-verified in EN and fa.

### Deploy 2 — the fix ships

Version `e761a753-7798-44a4-9f1e-dbbbbfe97fce`, live-verified
(«333,000 toman / exact: 333,333.33» on currena.ir/tools/dang, zero
console errors). Record PNGs: `tests/tools-suite-live/01…07` (index
EN / fa / fa-dark / fa-dark-375, the live board, the dang fix fa on
dev and EN live).

Nothing else was touched: currena-api and every other worker stand
as they were; the main site's own converter page is untouched.
