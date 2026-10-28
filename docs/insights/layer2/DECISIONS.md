# Layer 2 — Decisions (D-20…)

Continues the numbering after `docs/insights/layer1/DECISIONS.md` (D-01…D-19).
Every ambiguous point met while executing
`docs/insights/layer2/INSIGHTS-L2-PREP-SPEC.md` is logged here — no
questions were asked of the owner; the most conservative option was
chosen each time.

---

## D-20 — Freshness thresholds: one discipline, two consumers

**Assumption.** The spec (§3.2) prescribes conservative staleness defaults
per cadence — daily 4, weekly 10, monthly 45, quarterly 120 calendar days
— "which you may refine and must log", and demands staleness be relative
to each series' real publishing cadence, never absolute.

**Decision.** `packages/insights/src/freshness.ts` keys its thresholds on
exactly those numbers (`FRESHNESS_STALE_DAYS` — deliberately equal to
scoring.ts's `GRACE_DAYS`, pinned by a test), then imports each
definition's documented `staleAfterDays` override as the per-indicator
refinement: those overrides are the repo's own maintained record of real
release cycles (ABS monthly CPI ages ~87 days between releases → 95; BEA
quarterly GDP publishes ~27 days after quarter end → 215; …). Two
cadences never go stale by age: `per-change` (a policy level — the
existing engine's rule) and `manual` (rides the monthly 45-day window;
no indicator uses it today). The effect: freshness and the existing
status/staleness engine read the SAME number for every indicator, so the
two disciplines can never disagree bit-for-bit — the narrator's
freshness can never contradict the card the page shows. Nothing in the
status engine, verdict math, thresholds or alert behaviour was touched.

**Reason.** Pure cadence defaults WITHOUT the refinements would flag
legitimately-current series as stale (us-gdp-growth at 210 days is the
freshest BEA print that exists; recession-probability legitimately ages
~65 days between monthly releases) — false alarms that would exclude
live facts from narration and add noise lines to the page. Importing the
documented overrides is the conservative reading of "set cadence per
indicator from the inventory/source".

---

## D-21 — The AU trio is REPORTED at its real served cadence (monthly) while the daily RBA path is venue-blocked

**Assumption.** The spec's problem statement (§3) says `au-10y`,
`rba-expectations`, `au-us-10y-gap` "have been stale since 2026-09-30".
The live investigation (2026-10-28, evidence in AU-DATA-OPTIONS.md)
found the opposite of "frozen": the Worker's ingest fetches the RBA F2.1
MONTHLY table successfully on every run (the KV status blob lists both
F2.1 series `fetched` this morning), and the September file (published
02-Oct-2026) is the freshest monthly print that exists — the October row
arrives ~02-Nov-2026. What IS blocked from Cloudflare Workers egress is
the DAILY `f2-data.csv` path alone (Akamai; venue-verified 2026-10-21,
re-verified live 2026-10-28 via the rba-probe worker). Round 10's "every
rba.gov.au path blocked" claim is refuted by this morning's status blob
(seven RBA surfaces fetched OK).

**Decision.** `FRESHNESS_CADENCE_REFINEMENTS` reports the trio at
`monthly` — the real publishing cadence of the series actually served —
while the threshold still comes from the definition's own documented
40-day `staleAfterDays` override (the F3 venue-round number), so the
freshness tripwire is IDENTICAL to the status engine's (40 days: a
frozen F2.1 feed flips both at the same moment — see the freeze-tripwire
tests). Consequences, all intended: (a) the narrator receives the trio
as fresh MONTHLY facts with their own asOf and ageHours — it can never
mistake them for live daily prints, yet it can still explain the AU
gauge's own warnings (au-10y and au-us-10y-gap are 2 of the section's 7
firing warnings — excluding them would make the narration unable to
explain its own verdict); (b) this is exactly the spec's own P2.5 flow —
"a fix works: fresh readings appear, P1 reports fresh" — because the
fix-order item 1 (an official RBA file that is not blocked and is
permitted) IS the live F2.1 path; (c) when the daily path returns,
delete the refinement entries and the definitions' 4-day discipline
re-tightens (instructions in AU-DATA-OPTIONS.md).

**Reason.** The alternative (judge the trio at their DEFINITION's daily
cadence → stale today) would (i) flag monthly-current data as stale — a
false alarm the evidence contradicts, (ii) force the narrator to exclude
two of the AU section's seven firing warnings while still being asked to
explain the "stressed" verdict, and (iii) contradict P2.5's own
verification flow. The spec's own sentence — "staleness is relative to
each series' real publishing cadence" — is honoured by reporting the
served series' real cadence. The owner can flip this decision with a
three-line deletion (the refinement map) if they prefer the daily-cadence
reading; the tests name both behaviours.

---

## D-22 — The page-honesty line: "the card does not already say so" resolved conservatively

**Assumption.** Spec §3.4: where a reading is stale or unavailable, show
a small muted "Data as of {date}" line — ONLY if the card does not
already say so. Reading the code: EVERY card face already displays its
data date ("Data for {date}" in the v3 UI-20 meta row, rendered for
every cadence by `dataPeriodText`), the price tiles show per-card as-of
dates, and status-stale cards additionally carry the grey flag plus the
"stale, N days old" meta segment.

**Decision.** The line (`CardMeta.tsx` `FreshnessAsOfLine`, rendered by
both AlertCard and CompactRow through the shared `CardMetaRow`) fires
ONLY when: the reading's P1 freshness is `stale` or `unavailable` AND
the reading has an asOf to show AND its status is not `stale` (those
cards already flag and age their data). Since D-20 makes freshness agree
with the status engine on every threshold, no card meets these
conditions today — the line is a SAFETY NET (a future frozen feed whose
status override is widened past the freshness window, or a future
surface without the meta row), not a present visual change; the
invariant is pinned by tests (`freshness-line.test.tsx`). One new UI
string per language (`ui.cardDataAsOf`): EN "Data as of {date}", FA
«آخرین داده: {date}» — deliberately unlike the header's
`ui.dataAsOf` («داده‌ها تا {date} به‌روز هستند») which CLAIMS currency;
this one only dates the data. Persian-safe: no banned words, no em dash,
no digits in the template (the {date} renders through the fa locale
formatter); triaged in the copy manifest (round `2026-10-28-l2-prep`,
4,547 entries, audit clean). The line's clock is the visitor's — the
same clock the existing `ageInDays` helper in CardMeta.tsx already uses
for the stale-age segment.

**Reason.** The two readings of "already says so" (shows the date vs
flags the staleness) produce the same implementation once the thresholds
agree: a redundant second date line on a card that already shows its
date would be noise, and the spec adds "No other visual change". The net
is real, tested code that catches the failure mode the spec fears
(frozen data presented as live) the moment it actually occurs.

---

## D-23 — P3 vocabulary sharing: the generated-JSON option (the web app untouched)

**Assumption.** Spec §5.1: "ONE source of truth importable by both web
and Worker (a shared package or a build-time generated JSON, your
choice, but no duplicated text and no drift). The web app must keep
working exactly as today."

**Decision.** The build-time generated JSON: the web dictionaries stay
the only hand-edited copy; `pnpm narrator:vocabulary`
(`packages/insights/scripts/generate-narrator-vocabulary.ts`) generates
a deterministic snapshot of their `layer1` objects (indicators + glossary
+ ui, both languages, 129 + 23 × 2) into
`packages/insights/src/narrator/vocabulary.generated.json`, which only
the Worker-side accessor imports (`@currena/insights/narrator`).
Determinism: no timestamps — the payload carries the sha256 of both
source files, so it changes only when the copy changes. Drift is
gate-enforced: `pnpm narrator:vocabulary:check` regenerates in memory
and byte-compares (run inside `pnpm gates`, D-25); the generator also
enforces the en↔fa indicator/glossary parity at generation time. The web
app imports none of this — its bundle is untouched.

**Reason.** The shared-package move was rejected as the riskier path:
the Persian-copy audit's SOURCES are path-anchored to
`apps/web/src/i18n/insights-copy-fa.ts` (AST extraction by exact file
path), so moving the dictionaries would churn the 4,547-entry manifest
and endanger the "copy:audit clean with the same numbers" requirement;
the lazy-chunk boundaries and the layer1 validator's imports would move
with it. The spec explicitly sanctions the generated-JSON option, and
the drift gate gives it the same no-drift guarantee a move would have —
the hand-maintained text exists in exactly one place.

---

## D-24 — P4 narration-state shape: read the computed state, never re-derive it

**Assumption.** Spec §6 lists the narration input's contents but leaves
field-level decisions open.

**Decision.** `buildNarrationState(snapshot, now)`
(`packages/insights/src/narrator/state.ts`) is a pure projection:
- `verdict` carries the snapshot's own summary lines VERBATIM (the
  existing labels — never re-derived; the math decides, the AI explains).
- `alerts` = the warning-status readings, tier `needs-attention` (the
  v3 §4 state word for a firing warning), direction from `change30d`
  (fallback `moveScore`), magnitude = ONE rounded number + unit
  (`points`/`percent` from `changeKind`) + window (`30d` or
  `since-previous-release` from the cadence rule) — no raw dumps.
- `patterns` = fx rules whose outcome is `warning` or `watch` (the two
  alerting outcomes; `supportive`/`quiet`/`context`/`nodata` are not
  alerts), with their `counted` flag; `fxSignal` carries the fx
  document's own rollup verbatim, null when fx is absent (patterns [],
  fxSignal null — the honest minimum).
- `items` = every FRESH reading (the full partition: items + excluded =
  100, pinned by a test), each with its P1 freshness (asOf, ageHours,
  cadence — the D-21 refinement included) plus status, section, gauge
  membership (`voting`), value. Stale/unavailable readings land ONLY in
  `excluded` with a reason — never mixed into the facts.
- `dataAsOf` = oldest/newest asOf among the FRESH items only.
- `generatedAt` = the `now` parameter (the narrator's own clock; Layer 2
  passes its run time, tests pass frozen clocks).
- Arrays are id-sorted for stable serialization. The input's fx shape is
  `Pick<FxRuleState, 'id'|'outcome'|'counted'>` so the full live fx
  document satisfies it structurally.

**Reason.** Every field is either verbatim from the computed state or
derived by the freshness module that shares the status engine's
thresholds — there is no second arithmetic anywhere in the narration
path. The golden fixtures (a stressed LIVE day captured 2026-10-28, a
calm day, a stale-excluded day — summaries recomputed with the real
`summarizeByGauges`) pin the exact wire shape; shape-freeze tests fail
if the contract changes unnoticed.

---

## D-25 — `pnpm gates`: composition and failure semantics

**Assumption.** Spec §7: one command that runs typecheck, lint,
`copy:audit`, the strict Layer-1 validator, all tests, build + bundle
budget, in order; non-zero exit on any failure; one-screen summary.

**Decision.** `scripts/gates.mjs` (`pnpm gates`) runs SEVEN steps in
order — the six the spec lists plus the narrator-vocabulary drift check
(D-23) inserted after `copy:audit` as a copy-integrity gate. Every step
runs even when an earlier one fails (the summary shows the complete
picture); each failing step prints its last 30 output lines after the
summary; the exit code is non-zero on any failure. Key numbers are
parsed and shown per gate (packages, fingerprints, validator assertion
count, per-suite test counts, the two budget lines). The Layer-1
validator runs with `LAYER1_STRICT=1` exactly as the Layer-1 report §0
prescribes. The 5-line owner-side "Repairing CI" note landed in
docs/DEPLOY.md (P5.2).

**Reason.** The extra step is where the P3 drift gate lives — without a
place in the one command, drift protection would depend on memory. All
steps always run because a red summary that hides later gates would
repeat the CI-opacity problem this work item exists to fix.

---

## D-26 — P2 outcome: the F2.1 monthly path IS the live official fix; no new source wired

**Assumption.** Spec §4 orders the fix search: (1) an official RBA feed
or file that is not blocked and is permitted; (2) another free official
source for the same figures; (3) an existing free API the project
already uses; then "if no clean fix exists, mark the trio unavailable…

**Decision.** The investigation (full record: AU-DATA-OPTIONS.md) found
fix-order item 1 ALREADY SATISFIED and live: the RBA F2.1 monthly table
is official RBA data, is NOT blocked from Cloudflare Workers egress
(fetched by every ingest run; re-verified via the r10-probe worker), and
is permitted (RBA material is CC BY 4.0 per LICENCES.md L0, attribution
"Source: Reserve Bank of Australia" already on the cards) — the trio
rides it with honest asOf dates. The DAILY figures (f2-data.csv) remain
blocked from Worker egress (re-verified live 2026-10-28: HTTP 403 via
the rba-probe worker) — and no legitimate daily alternative exists
today: aofm.gov.au answers HTTP 520 from Worker egress; data.gov.au is
reachable but carries no daily AGS 10y/3y yield dataset; FRED's AU
long-term series is OECD-sourced MONTHLY (no granularity gain over
F2.1); ASX terms prohibit automated access (L3); Yahoo has no AU-10y
yield ticker and its endpoints are L2-limited to the four price tiles.
Therefore the P2.4 "mark unavailable" branch is NOT triggered (a clean
fix exists and works); instead P2.5 applies: fresh readings appear (the
September monthly prints), P1 reports fresh (D-21), and the free-tier
impact is ZERO new KV operations and ZERO new external calls (the F2.1
fetch was already part of the daily ingest; this session added none).

**Reason.** Wiring any new daily source would have meant either
unreachable venues (AOFM), non-existent datasets (data.gov.au), licence
failures (ASX), or zero gain (FRED monthly). The honest state is: daily
granularity is venue-blocked; monthly granularity is LIVE from the
official source; the page and the narrator both say which is which (the
asOf dates, the monthly cadence in the narration state, the sourceRef on
the cards). The single recommended next step (watch for the f2 unblock
and re-tighten; the GHA venue as the owner-side fallback once Actions
minutes reset) is recorded in AU-DATA-OPTIONS.md.

---

## D-27 — The R10 "every rba.gov.au path blocked" claim is corrected, with evidence

**Assumption.** ROUND10_REPORT.md R10-1 states the Worker's egress is
"Akamai-blocked on every rba.gov.au path (CSV tables AND the HTML
cash-rate page)". The Layer-1 FINAL-REPORT §9.4 repeats the trio's
readings as "stale". The prep spec's premise follows both.

**Decision.** The live evidence collected this session (2026-10-28) and
recorded in AU-DATA-OPTIONS.md supersedes that claim for the record: the
04:10 UTC ingest's own status blob shows cash-rate HTML + F1 + F1.1 +
E2 + F6 + F4.1 + BOTH F2.1 series fetched OK from the Worker's egress
(the only RBA row is the honest `disabled` skip of f2-data.csv); the
rba-cash-rate reading is at asOf 2026-10-27 (F1 daily, fresh); invoking
the still-deployed rba-probe worker returns HTTP 403 for f2-data.csv
and the r10-probe worker serves the F2.1 CSV (publication date
02-Oct-2026). The trio's data is therefore monthly-CURRENT, not frozen —
the November F2.1 print (~02-Nov) is the next expected refresh, and a
true freeze trips the 40-day status/freshness window automatically. No
code was changed on the strength of the old claim; the documentation now
carries the corrected one.

**Reason.** An investigation that documents a venue block must be
re-verifiable — the probes and the status blob ARE the verification, and
they say the block is path-scoped (f2-data.csv only), not site-scoped.
Recording this protects Layer 2 from excluding current data on a stale
premise, and gives the owner the precise watch-item (the f2 path, not
"RBA").

---

# Layer 2 Narrator — Decisions (D-28…)

The AI narrator build (per `docs/insights/layer2/
INSIGHTS-L2-NARRATOR-SPEC.md`) logs every ambiguity here, resolved
conservatively. D-28..D-31 record the research findings RE-VERIFIED in
the official docs on 2026-10-28 (the session that built M1); D-32 the
section enumeration; D-33..D-35 are reserved for M2–M4; D-36 records
M1's implementation decisions; D-37+ are reserved for the later
milestones. The research starter's pre-recorded findings live in
`docs/insights/layer2/RESEARCH-STARTER.md` (superseded where the
decisions say so).

## D-28 — The Gemini model + free-tier limits (re-verified in the official docs, 2026-10-28)

**Assumption.** The spec (§5) requires looking up the CURRENT Flash-class
model, the free-tier rate limits and grounding availability in Google's
official docs before recording decisions; the research starter's
2026-10-28 findings guessed `gemini-3.1-flash-lite` / `gemini-3.8-flash`.

**Re-verification (fetched live from ai.google.dev, 2026-10-28).**
- The canonical REST surface is now the **Interactions API**:
  `POST https://generativelanguage.googleapis.com/v1beta/interactions`
  with `{model, system_instruction, input, generation_config, response_format,
  tools}` and the `x-goog-api-key` header. `generateContent` still exists
  (the docs carry a toggle), but Interactions is the documented default —
  M3's client speaks Interactions.
- Current catalog: Gemini 4 Argon (**not** free-tier eligible), 3.1 Pro
  Preview, **3.5 Flash-Lite**, 3.8 Flash, 3.1 Flash Lite, 3.6 Flash; the
  2.5 family is access-limited: “For any new projects, use our latest
  models: 3.5 Flash-Lite or 3.8 Flash.”
- Structured output: `response_format: {type: 'text', mime_type:
  'application/json', schema}` (JSON Schema subset) — schema-constrained
  output IS supported on the current API (the spec's call type A).
- Temperature: “Gemini 4 and Gemini 3.6+ models ignore custom values for
  temperature, top_p, and top_k.” 3.5 Flash-Lite is pre-3.6, so the
  spec's temperature 0.2 still applies to the default model; if the owner
  bumps NARRATOR_MODEL to 3.6+/4 the API ignores it (a deprecation
  warning header, harmless) — the deterministic validators (V1–V10), not
  the temperature, are the safety net.
- Free tier: text generation “Free of charge” (paid $0.30/1M input on
  3.5 Flash-Lite); the spend-based rate limit table says **Free = N/A**
  (a project without billing can never be charged — the spec §10
  guarantee holds structurally). RPD resets at midnight Pacific; limits
  apply per project, not per API key. The static docs no longer publish
  per-model RPM/RPD tables (“View your active rate limits in AI Studio”)
  — the design therefore does not depend on the exact numbers.

**Decision.** `NARRATOR_MODEL` env var default = **`gemini-3.5-flash-lite`**
(Google's explicit new-project recommendation; free tier; Flash-Lite
class — adequate for ≤120 words of plain explanation). The research
starter's 3.1-flash-lite guess is superseded by the models doc's own
recommendation. Rate design: at most 3 model calls per cron tick (spaced
≥60 s by the minute cron — trivially inside any reported RPM), ~6–11
calls/day total — far inside even the most conservative reported
Flash-class free limits. The set-key tool (M3) makes one minimal live
call, which is also the definitive per-project limit check.

**Reason.** Conservative on every axis: the newest recommended
free-tier model, a request rate the free tier cannot plausibly refuse, a
billing-ineligible project so charges are structurally impossible, and a
design whose correctness does not depend on unpublished per-model
numbers.

## D-29 — Google Search grounding — terms + display requirements (re-verified 2026-10-28; SHIP DISABLED)

**Assumption.** Spec §5's grounding-terms gate: read the CURRENT terms,
decide the display elements, storage/redistribution and free-tier
eligibility; if any requirement cannot be met or is unclear, ship part 3
disabled. The research starter's findings described the OLD response
shape (`groundingMetadata` / `webSearchQueries` / `groundingChunks` /
`searchEntryPoint.renderedContent`).

**Re-verification (fetched live, 2026-10-28).** The grounding doc has
CHANGED shape: responses now carry `google_search_call` (the executed
queries), `google_search_result` (with **`search_suggestions`** — “an
HTML snippet for rendering search suggestions in your UI. Full usage
requirements are detailed in the Terms of Service.”) and `model_output`
with inline **`url_citation`** annotations (start/end index + url +
title). The old field names appear nowhere in the current doc. Free-tier
eligibility: YES — the pricing page shows “Grounding with Google Search:
Free tier **1,500 RPD (free)**, then $35 / 1,000 grounded prompts”, and
the grounding doc bills per executed search query with **5,000 free
search requests/month** shared across Gemini 3+ models ($14/1,000
after). Both numbers are recorded: the binding daily cap is 1,500
grounded requests/day; the monthly query budget is 5,000.

**Decision.** **SHIP PART 3 DISABLED** (`NARRATOR_WEB_CONTEXT=false`),
exactly as the research starter's conservative default prescribed — now
with evidence: (a) the Terms of Service that govern the required display
elements were not fetched and read in full this session; (b) the display
obligations (rendering Google's `search_suggestions` HTML snippet + the
inline citation annotations) are implementable but NOT yet implemented;
(c) the base A-section + A-overall narratives work without grounding and
ship first. Part 3 is enabled only after a later session reads the
current ToS in full, implements the required display elements exactly,
and passes the eval; the env flip is one variable. `NARRATOR_WEB_DAILY_CAP`
default 20 grounded calls/day — under the 1,500-RPD free cap by 75× and
a small slice of the 5,000/month query budget (≤600/month at the cap).

**Reason.** The spec's own rule: unclear or unimplemented requirements →
disabled, and say so. The re-verification also protects M3/M5 from
building against the retired response shape.

## D-30 — Cloudflare Worker limits (re-verified 2026-10-28) + the cron-rung design

**Assumption.** Spec §2: check the CURRENT Cloudflare limits (subrequests
per invocation, CPU time, cron triggers, KV ops/day) and design within
them; the research starter's 2026-10-28 numbers needed re-verification.

**Re-verification (developers.cloudflare.com, pages updated Oct 8–12,
2026).**
- **Subrequests:** 50/invocation (Free) · 10,000 (Paid). Each subrequest
  in a redirect chain counts.
- **CPU time per Cron Trigger:** 10 ms (Free) · **30 s (Paid, <1 h
  interval)** · 15 min (≥1 h interval). **Wall-clock duration for a cron
  invocation: 15 minutes.** (The starter's “30 s wall / 10 ms CPU”
  reading is corrected: 30 s is the PAID CPU allowance for sub-hourly
  crons; waiting on fetches never counts toward CPU.)
- **Cron Triggers: 5 per ACCOUNT** (Free) · 250 (Paid) — the starter said
  per Worker; the docs say per account. The account runs 8 Workers
  (currena-api, currena-markets, two probes, four others); currena-api
  uses ONE trigger (the minute cron) — **no new trigger is needed**; the
  narrator is a new hour+minute-gated RUNG inside it.
- **KV (Free):** 100,000 reads/day · 1,000 writes/day (different keys) ·
  same-key writes 1/second — unchanged. A NEW row in the Oct-2026 docs:
  “Operations/Worker invocation: 1 (Free) / 1,000 (Paid)”. The account's
  existing minute cron demonstrably performs several KV operations per
  tick (keep-warm, watchdog, ingest rungs), so the account either runs
  Workers Paid or the row does not constrain the existing topology; the
  narrator design keeps to ≤2 reads + ≤1 write per tick regardless and
  the first live day's actuals are reported (M4).

**Decision.** The design from the research starter, now verified against
the current numbers: the narrator runs as a new rung in the existing
minute cron (hour+minute-gated, e.g. :50 UTC — never sharing an
invocation with the ingest/history rungs), **≤3 model calls per tick**,
stateHash per unit, pending units carried in KV, ONE KV write per cycle
that changed something. Daily totals at steady state: ~24 ticks/day ×
≤2 KV reads = ≤48 cron reads/day (visitors add ZERO — the endpoint is
edge-cached `s-maxage=600`), ~1–3 writes/day, ~6–11 model calls/day —
inside every limit on both plans with two orders of magnitude of
headroom.

**Reason.** The per-tick cap is the binding conservative choice: it
keeps the narrator's worst tick (3 sequential 15 s-timeout model calls +
KV + JSON parsing) inside the 15-minute wall clock, the 30 s paid CPU
allowance with room, and the 50-subrequest free envelope even if the
account turned out to be Free.

## D-31 — Region risk + the template-fallback default (re-verified 2026-10-28)

**Assumption.** Spec §5: calls from some Cloudflare locations can be
refused (“location not supported”); handle explicitly and check current
mitigations.

**Re-verification.** The risk stands as documented (the Gemini API
publishes an available-regions list; 403 location refusals are a
documented behaviour for unsupported caller regions). The Cloudflare
egress region that serves `generativelanguage.googleapis.com` for THIS
account cannot be verified without an API key — and no key exists in
this session by design (the owner enters it via `pnpm narrator:set-key`,
M3). Mitigations confirmed as current options: `placement: { mode:
'smart' }` in wrangler.jsonc, Cloudflare AI Gateway, and the always-safe
fallback.

**Decision.** The template fallback (M1's `templateNarrative` — pure,
zero network, passes V1–V10) is the DEFAULT path whenever the API is
unreachable, refused, invalid or failing: no key → templates; kill
switch → templates; two validation failures → templates. Region
refusals are counted in the stats buckets (M4). After the owner sets the
key, the first live week decides: if region errors exceed 1 in 5
A-generations, switch to `placement: { mode: 'smart' }` and re-test; if
still failing, `NARRATOR_ENABLED=false` and document. A one-off probe
(the set-key tool's validation call, M3) records the actual behaviour
the moment a key exists.

**Reason.** The fallback makes the worst case a slightly plainer text,
never an error or an outage — the conservative ordering the spec's kill
criteria (§13) assume.

## D-32 — The section list + the overall state's alert policy (M1, built)

**Assumption.** Spec §3: “discover the sections from the code”; the
research starter's conservative plan (4 sections + 1 overall) needed
confirming against the code, and the overall state's “top few alerts
across sections” needed an interpretation.

**Decision.** Section list = `['global', 'australia', 'world-markets',
'world-currencies']` + the `overall` unit — confirmed against the page:
the four mother containers (the two indicator lanes + WorldMarkets +
WorldCurrencies). The prices-board group is part of `global` (its
indicators are `section: 'global'`); the dollar-strength cards ride
global's electorate even though they RENDER inside the currencies
container (R9-04) — the currencies section state is the fx document
itself (10 pairs + the dollar measure + the 7 rules), and the fx dollar
measure rides as the `dollar-basket` item (the vocabulary entry that
names it).

The overall state carries **every** firing alert across sections, each
tagged with its section — NO cap and NO invented severity ordering:
“the top few” is the PROMPT's instruction to the model (name one or two
themes), not a state truncation; the choice is the model's, from facts.
Markets alerts sort bear-before-correction (the section's own tier
order), fx alerts warning-rule-first — the sections' own orderings, not
new arithmetic. The markets section's verdict is the engine's own
summary (signal + counts + worstGroup, verbatim); the page's 4-step
editorial word (Bullish/Mixed/…) is a UI composition over those fields
(breadth split) and is NOT re-derived in the package — no duplicate
logic to drift.

**Reason.** Every boundary follows an existing page structure or an
existing computed value; where the spec's wording was open (“top few”),
the reading that adds no new math and removes no facts was chosen.
SECTION-STATE.md documents the full contract; the golden fixtures pin
it.

## D-33 — The secret-scan addition to `pnpm gates` (M2, built)

**Assumption.** Spec §10: "Add to `pnpm gates` a secret scan (Google key
pattern `AIza[0-9A-Za-z_-]{35}` and generic long secrets) over the whole
repo and its tracked files; also ensure `.dev.vars` and similar are
git-ignored."

**Decision.** `scripts/secret-scan.mjs` runs as **gate 0** of
`scripts/gates.mjs` (before typecheck — a leaked key fails the build
FIRST) and in two modes:

- **The scan**: 8 patterns over every GIT-TRACKED text file (628 today):
  the Google `AIza…` shape, GitHub PATs (`ghp_`/`github_pat_`), OpenAI
  `sk-…`, AWS `AKIA…`, Slack `xox?-…`, the EODHD key shape
  (`hex.hex` — this repo's other live credential), and a generic
  credential-assignment pattern (`api_key|secret|token|password =
  "…24+ chars…"`, case-insensitive, deliberately WITHOUT a leading word
  boundary so `GEMINI_API_KEY` matches). Findings print file:line + the
  pattern name + a REDACTED value (first 6 chars + length) — the scan
  reports WHERE, never the secret itself. `pnpm-lock.yaml` is the one
  documented skip (integrity hashes). An explicit allowlist carries the
  six deliberate test-fixture credentials (each naming its file); test
  files stay scanned — "let me test with the real key" is a classic leak
  vector.
- **The ignore check**: `.dev.vars`, `.dev.vars.local`, `.env`,
  `.env.local` must be git-ignored (root + apps/api) and none tracked
  (all true today).
- **`--self-test`**: the patterns are verified in memory against 9
  known-positives and 8 known-negatives (no fixture file with fake keys
  exists in the repo, by design). The gate runs the scan AND the
  self-test.

Verified by planting a realistic `AIza…` key in a tracked file: the scan
fails with the file, line and redacted value. The free-tier key-creation
+ rotation documentation landed in `docs/DEPLOY.md` ("The Gemini key"
section, per spec §10).

**Reason.** Gate 0 ordering is the point: every later gate — and every
deploy — is unreachable while a credential is in the tree, and the
self-test keeps the patterns from rotting silently.

## D-34 — The staged-rollout visibility flag (decided in M3; implemented in M4–M5)

**Assumption.** Spec §11: "STAGED ROLLOUT: while `NARRATOR_VISIBLE=false`
the narratives are generated and stored but shown only in preview (URL
marker that works with the hash router, e.g. `?narrative=preview`). The
owner reads real text on the real page for about a week, then flips
visibility."

**Decision.** `NARRATOR_VISIBLE` defaults to **`false`** in
`apps/api/wrangler.jsonc` vars. The generation cycle (M4) runs and stores
narratives regardless (the flag is DISPLAY-only — the KV always carries
the texts, so flipping visibility never waits for a generation cycle).
The preview marker is `?narrative=preview` BEFORE the hash (the SPA is a
hash router: `currena.ir/?narrative=preview#/insights` — a query the
Worker's asset serving passes through untouched, read once at app boot,
never persisted). The flip is one owner command:

```sh
# flip visibility ON (or back OFF) — a vars update + redeploy:
cd apps/api && pnpm exec wrangler versions upload --var NARRATOR_VISIBLE:true
```

(or edit `wrangler.jsonc` and redeploy the normal way — the command form
keeps it one copy-paste line). The owner reads real text at the preview
URL for about a week, then flips; the kill criteria (D-35/M5) flip it
back off the same way.

**Reason.** The default-off + one-line flip keeps the rollout reversible
to the second: nothing user-facing changes until the owner has read a
week of real output in both languages, and the KV-backed texts mean the
flip is instant.

## D-35 — Reserved: The kill criteria defaults

**Reserved** — the next session records: the kill-criteria thresholds
(spec §13) and the one-line switch-off instructions in
`docs/insights/layer2/KILL-CRITERIA.md`. Narrator off (templates only)
if: >1 in 5 A-generations fail validation; any published text
contradicts a gauge/verdict; API/region errors make it unreliable.
News context off (`NARRATOR_WEB_CONTEXT=false`) if: any item is found
inaccurate or stale on a spot check; any item gives advice; Google's
terms change in a way we cannot meet; >1 in 3 grounded outputs omitted
by checks.

## D-36 — M1 implementation decisions (the pure foundation)

The per-implementation decisions of Milestone 1 (each resolved
conservatively, pinned by tests):

1. **The Layer-1 word canon moved into the insights package.** JARGON,
   BANNED_EN/FA, the G5 patterns and TENOR_TOKEN moved VERBATIM from
   `apps/web/.../layer1/layer1.test.ts` into
   `packages/insights/src/narrator/wordlists.ts`; the Layer-1 gate now
   imports them from `@currena/insights/narrator`. One source of truth
   for G3/G4/G5/G6 and V4/V5/V6 (+W3/W5/W6); the 7,809-test count is
   unchanged (verified). The narrator's own seed lists (predictions,
   tone words, attribution phrases, out-of-date markers) live beside
   the canon, clearly separated — the Layer-1 gate never reads them.
2. **V5's state-verbatim exemption.** The page's own status words
   ("Correction", "Bear market" — jargon-listed with NO glossary term,
   because Layer-1 copy never needed them) are carried IN the markets
   state (`statusWords`) and may be restated: a jargon phrase that
   appears verbatim in the unit's state is a fact, not invented jargon.
   The provided vocabulary's own text is already G3-clean, so its
   glossary covers its own terms (getNarratorVocabulary returns the
   used terms).
3. **V3's allowed numbers include the provided vocabulary's own
   numbers** (tenor names like "10-year" inside plainName/oneLine) plus
   the state's numbers (with roundings, signs, abs, day-ages and date
   parts) — the model was given that text verbatim, so restating it is
   never an invented number. Without this, a template quoting a
   vocabulary oneLine could fail V3 whenever the state's dates
   coincidentally lacked the tenor digit.
4. **The template composition guarantees.** §8's "2–4 sentences" and
   V2's prompt limits (3–5 section / 4–6 overall) are reconciled via
   the intersection: section templates emit 3–5 sentences (a 3-sentence
   floor by construction: verdict + content + honest fillers; 5
   ceiling), the overall exactly 4 (its out-of-date clause merges with
   the not-advice reminder into one sentence). Vocabulary oneLines
   carry their own trailing period; `finish()` terminates every
   sentence exactly once.
5. **The template's FA copy** is hand-written template copy (Persian
   digits via the shared mapper, Persian decimal separator ٫, correct
   half-spaces, no em dash, no Latin) — triaged in the Persian copy
   manifest like every other fa string in the packages (the
   `technical.*` precedent).
6. **stateHash** = sha256 (a pure in-package implementation, FIPS
   vectors pinned — AGENTS.md rule 2 forbids node:crypto in packages)
   over the stable serialization with `generatedAt` and every
   `ageHours` stripped; freshness flips and asOf changes are CONTENT
   and regenerate.
7. **The section fixtures' provenance:** global/australia reuse the
   committed prep fixtures' inputs verbatim (stressed-live, calm,
   stale-excluded); world-markets/world-currencies/overall were
   captured LIVE from currena.ir on 2026-10-28 (the real
   attention day: 6 corrections + 1 bear; the r6 warning + the EUR/CHF
   unusual move). The builder script is committed for regeneration on
   intentional contract changes only.

## D-37 — M3 implementation decisions (the client + the tools)

The per-implementation decisions of Milestone 3:

1. **The client speaks the Interactions API** (D-28's re-verification):
   `POST /v1beta/interactions` with `system_instruction` + `input` +
   `generation_config` (temperature 0.2, short max_output_tokens) +
   `response_format` (the `{en, fa}` JSON schema, call type A) or
   `tools: [{type: 'google_search'}]` (call type B). The key rides ONLY
   in the `x-goog-api-key` header.
2. **The response shape is parsed defensively.** The static docs publish
   SDK helpers (`output_text`) but not the raw REST JSON;
   `extractOutputText` reads `output_text`, the outputs/output content
   blocks, and the generateContent-style candidates as a compatibility
   fallback. The set-key tool's one validation call (the models list) is
   the live check on the key; M4's first live generation confirms the
   response shape, and the client reports a typed `schema` error (never
   a crash) if Google moves it.
3. **Every failure is a value, never a throw**: the typed error taxonomy
   (invalid-key · quota · region · http · network · timeout · schema ·
   empty) is what M4's stats buckets count. Details are redacted (≤120
   chars, one line) — never the key, a full prompt or raw output (spec
   §5's logging rule).
4. **The retry ladder**: exactly ONE retry on network/timeout/5xx;
   never on 4xx (an invalid key or a region refusal must not burn a
   second call). 15 s timeout per attempt via AbortSignal.
5. **The set-key tool** (`pnpm narrator:set-key`) reads the key with
   hidden input only, refuses it as an argument/env value, warns on the
   non-AIza shape (the OAuth "AQ." confusion), validates with ONE
   minimal call (the models list — zero generation tokens), then pipes
   it to `wrangler secret put GEMINI_API_KEY` via stdin in apps/api;
   wrangler auth failures print the single fix command. Success prints
   exactly "Key saved. Nothing else to do."
6. **The offline eval** (`pnpm narrator:eval`, gate 5): 3 prep fixtures
   re-derived + 7 section/overall fixtures through the templates (V1–V10
   both languages) + the prompt assembly (deterministic, no key shape) +
   4 good mocked model outputs accepted + 10 deliberately bad ones
   rejected by their intended checks (invented number V3, invented cause
   V7 — the sample names an out-of-state indicator by its plainName,
   advice V4, wrong tone V8, English digits in Farsi V6, missing
   out-of-date clause V10, news digits W2 / quotes W8 / no sources W1 /
   no attribution W4). 50 checks total.

## D-38 — M4 implementation decisions (the rung + KV + the endpoint; DEPLOYED disabled)

The per-implementation decisions of Milestone 4 (the first deploy of the
narrator build):

1. **The rung**: `NARRATOR_CRON_MINUTE = 50` — hourly, inside the
   existing minute cron (no new trigger), clear of every other rung
   (:10 sweeps, :13 prices, :15 Frankfurter, 04:10–04:40 ingest, :40
   watchdog). Budget verified against D-30's re-read limits: 4 doc reads
   + 1 stats read + ≤2 writes per ACTIVE tick; ~24 ticks/day → ~120
   reads + ≤50 writes/day — inside every free-plan envelope with orders
   of magnitude of headroom. Visitors add ZERO reads (the endpoint is
   edge-cached).
2. **The input is the PUBLIC PROJECTION snapshot** (`insights:snapshot-public`)
   + the markets/fx documents — deliberately NOT the private snapshot:
   whatever the site mode, the narrative can never name a private-only
   reading. The public projection is written unconditionally by the
   daily ingest, so the narrator keeps its input in every mode. A
   missing projection (fresh deploy) logs honestly and skips.
3. **The pending list IS the stored doc**: each unit's `stateHash` +
   `generatedAt` in `insights:narrative:v1` (spec §9's shape) — a unit
   works when its hash changed, its text is >24 h old, or the prompt
   version moved. No extra KV key; the capped batch (3/tick, page
   order) continues next hour. ONE write per tick that changed
   something.
4. **The kill switch semantics**: `NARRATOR_ENABLED=false` (the deployed
   default) still RUNS the rung and stores TEMPLATE narratives (the
   spec's "templates only"); model calls happen only when enabled AND
   the key exists. Without a key the rung is a no-model-call template
   writer (the spec §10 safe-without-key rule).
5. **The endpoint** (`GET /api/insights/narrative`) serves the stored
   doc verbatim with `Cache-Control: public, max-age=300, s-maxage=600`
   — NOT gated and NOT rate-limited, deliberately: the doc is derived
   exclusively from public-projection + public-board data (it can never
   leak a private reading), it is Layer-1-copy-grade content, and the
   edge cache makes visitor traffic free. A missing/poisoned doc answers
   the clean 404 envelope (`narrative_not_ready`) — the display renders
   nothing (spec §11). In private mode the page's display block sits
   behind the gate anyway.
6. **The stats buckets** (spec §9) live under `insights:narrator:stats`
   (14 daily buckets, pruned on write): runs · skippedUnchanged ·
   aiValid · aiFailedByCheck (per check id) · apiErrors (per error kind,
   region included) · templateUsed · newsAttempted/Valid/OmittedByCheck/
   OverCap. The kill criteria (§13) read exactly these.
7. **The env vars** landed in `apps/api/wrangler.jsonc`:
   NARRATOR_ENABLED=false · NARRATOR_VISIBLE=false (D-34) ·
   NARRATOR_WEB_CONTEXT=false (D-29) · NARRATOR_WEB_DAILY_CAP=20 ·
   NARRATOR_MODEL=gemini-3.5-flash-lite (D-28). GEMINI_API_KEY is a
   SECRET (set via `pnpm narrator:set-key`), never a var.
8. **Deployed disabled** (see docs/DEPLOY.md's session record): the
   endpoint serves template narratives; the first :50 rung after deploy
   wrote the initial document; no key exists on the worker, so zero
   model calls are possible until the owner sets one.

## D-39 — M5 implementation decisions (display + live eval + kill criteria + final report)

The per-implementation decisions of Milestone 5 (the final milestone of
the Layer-2 narrator build):

1. **The `visible` flag is additive to the route response, not to the
   stored doc.** The route spreads `{ ...doc, visible: env.NARRATOR_VISIBLE
   === 'true' }` into the response — the KV document at
   `insights:narrative:v1` carries NO `visible` field (the doc stays
   display-stable across deploys; the flag is a runtime/env signal, never
   a stored value). The web reads `doc.visible` from the response (and
   treats the cached value as stale — the live fetch wins on every
   refresh). The `?narrative=preview` URL marker overrides `visible`
   locally so the owner can read the texts for a week before the public
   flip (D-34). The M4 unit test (`serves the stored document verbatim`)
   was reshaped to destructure `visible` before comparing the doc fields
   — the doc fields still ride through verbatim.

2. **The preview marker is read from BOTH `window.location.search` (the
   canonical `currena.ir/?narrative=preview#/insights` form) AND the hash-
   router's query params (the share-link form
   `currena.ir/#/insights?narrative=preview`)** — the canonical form lives
   BEFORE the hash, so the hash router's `routeQuery()` does NOT see it.
   `useNarrativePreview` checks both sources once at mount (the spec §11
   "read once at app boot, never persisted"). Either form works.

3. **The display gate is `narrativeDoc !== null && (narrativeDoc.visible
   || narrativePreview)`** — the doc must be present (the fetch succeeded
   or the cache had a copy) AND either the runtime `visible` flag is true
   OR the URL marker is set. When the gate is closed, NarrativeBlock
   returns null and the page renders exactly as it did before Layer 2 (no
   new divs, no new shells, no console warnings). The spec §11 "render
   nothing; nothing breaks" rule.

4. **The fetch is unconditional; the gate is display-only.** The
   `useNarrative` hook fetches `/api/insights/narrative` on every Insights
   mount, regardless of the gate — the texts must be ready in the cache
   when the owner flips `NARRATOR_VISIBLE=true` (the spec §11 staged
   rollout: "narratives are generated and stored but shown only in
   preview"). The fetch is best-effort (null on any failure → no block);
   the localStorage last-good copy paints instantly (the markets/fx feed
   discipline verbatim).

5. **The NarrativeBlock component mirrors the Layer1Block idiom.** Same
   global CSS tokens (`--type-label`, `--type-caption`, `--color-text-*`,
   `--color-border`, `--color-status-context`), same `<bdi>` wrapping for
   RTL safety, same `data-*` attributes for testability
   (`data-narrative-block` + `data-narrative-source={unit.source}`). The
   block lives INSIDE the section's existing mother container — no new
   shell, no new ring — so it reads as "the next line under the heading".
   The `ai` disclaimer («نوشته‌شده با هوش مصنوعی، نه توصیهٔ مالی» /
   "AI-written, not financial advice") sits beside the label ONLY when
   `source === 'ai'`; templates carry no disclaimer (the spec's "template
   → no AI label" rule). The "Updated {time}" line uses the house
   `formatRelativeShort` (Jalali in FA, words in EN); same-day generations
   collapse to the localized "today" / «امروز» word (never a live clock).

6. **The InTheNews component is visually separate.** A
   `currena-warning`-tinted card (the section's "this is different"
   signal) with a hairline `currena-warning/30` ring, sitting as a sibling
   immediately after the NarrativeBlock (NOT inside it). The sources
   render as `<a target="_blank" rel="noopener noreferrer">` (the spec's
   exact safety requirements). Google's required display element
   (`requiredDisplay`, the search-suggestions HTML) renders via
   `dangerouslySetInnerHTML` beside the note — only present when grounding
   metadata returned one (W1). A `safeUrl` guard drops anything that's not
   `http(s):` (the parent W1 check should have already filtered sourceless
   news out; this is the display-time guard).

7. **The M5 UI strings are 6, not 2–3.** The spec said "2-3 new UI
   strings" — M5 ships 6: `narrativeLabel`, `narrativeUpdated`,
   `narrativeUpdatedToday` (the same-day form of `{time}`), the
   `narrativeAiDisclaimer`, `inTheNewsLabel`, `inTheNewsDisclaimer`. The
   4 extras (`narrativeUpdatedToday`, the disclaimer, the in-the-news
   pair) are unavoidable per the spec §11 wording (the spec EXPLICITLY
   names both disclaimers verbatim + the "Updated <time>" line). All 6
   triaged through `docs/localization/persian-copy-manifest.json` under
   round `2026-10-28-l2-m5`, reference `docs/insights/layer2/DECISIONS.md`.

8. **The D-16 bundle-bump path: 1100 → 1110 raw, gz unchanged.** M5's
   additions (NarrativeBlock + InTheNews + lib/narrative.ts + the
   useNarrative/useNarrativePreview hooks + the wiring in
   Insights.tsx/SectionLane/WorldMarkets/WorldCurrencies/world-feeds + 6
   new UI strings × 2 locales) measured 1100.49 kB raw / 258.36 kB gz —
   over the 1100 raw ceiling by 0.49 kB, well inside the 260 gz ceiling
   (1.64 kB headroom). The entry chunk is untouched at 295.37/88.84. The
   D-16 path is unavoidable (the spec's M5 display scope); the bump
   carries 10 kB of raw headroom for the next small Layer-2 tweak, the gz
   ceiling is unchanged. `scripts/check-bundle-budget.mjs` line 693
   documents the bump; the comment block traces the rationale.

9. **The live eval harness (`pnpm narrator:eval:live`) skips cleanly when
   `GEMINI_API_KEY` is unset** (exit 0 with one line — the spec §12
   "skipped cleanly if absent" rule). The owner runs it in their own
   terminal after `pnpm narrator:set-key` (M3); the script reads the key
   from the env (`export GEMINI_API_KEY=…`), never from argv. The 7
   section/overall fixtures run through the real model (call type A) with
   the production retry ladder (first-failure → regenerate-with-check-
   names → template fallback); 1 fixture (world-currencies) runs through
   the grounded news call (call type B). The output writes to
   `docs/insights/layer2/EVAL-OUTPUTS.md` for the owner to read in their
   editor (never the terminal — the file carries EN + FA + the validation
   verdict + the source + the model + the timing per fixture).

10. **The kill-criteria doc (`docs/insights/layer2/KILL-CRITERIA.md`) is
    the operator's runbook**, not a spec recital. The spec §13 thresholds
    are translated into the 4 narrator-off + 4 news-off + 1 full-kill
    cases, each with the exact `wrangler versions upload --var …` command
    (the deploy-lock protocol stays intact). The stats-read command +
    the 7-day rolling ratio formula is spelled out (the owner reads
    `insights:narrator:stats` from KV via `wrangler kv:key get`). The
    first-week discipline (the staged rollout: set-key → flip
    `NARRATOR_ENABLED=true` → read at preview URL for ~7 days → flip
    `NARRATOR_VISIBLE=true`) closes the doc.

11. **The final report (`docs/insights/layer2/LAYER2-REPORT.md`) is the
    spec §14 deliverable**, with the exact copy-paste owner commands
    (`pnpm narrator:set-key`, the preview URL, the visibility flip) +
    the gate numbers from this milestone + the free-tier numbers (D-28)
    + the Cloudflare limits (D-30) + the grounding-terms decision (D-29:
    Part 3 ships DISABLED) + the region-risk findings (D-31) + the
    decisions D-28..D-39. The live-verification evidence (the deployed
    version ID, the EN+FA screenshots at 360px and 1280px) lands in the
    DEPLOY.md session record per the existing pattern.

## D-40+ — Reserved: post-M5 (the owner's first live week)

**Reserved** — after M5 ships + the owner sets the key + reads a week of
real text at the preview URL, the next session records: the
`NARRATOR_ENABLED=true` flip (templates → AI), the first live stats
buckets, the first kill-criterion review, and (if green) the
`NARRATOR_VISIBLE=true` flip (preview → public). The D-29 grounding-terms
gate stays closed until the owner reads the current Google terms in full
+ confirms each display requirement is implementable (the
`requiredDisplay` rendering path in InTheNews is built; the gate is the
terms review, not the code).
