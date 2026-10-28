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

# Layer 2 Narrator — Reserved decisions (D-28…D-36+)

The next session (the AI narrator build per
`docs/insights/layer2/INSIGHTS-L2-NARRATOR-SPEC.md`) populates these.
Research findings are pre-recorded in `docs/insights/layer2/
RESEARCH-STARTER.md`; the next session RE-VERIFIES each finding in the
official docs before writing the decision text.

## D-28 — Reserved: Gemini model + free-tier limits

**Reserved** — the next session records: the current Gemini Flash-class
model name (likely `gemini-3.1-flash-lite` or `gemini-3.8-flash` per
2026-10-28 research; re-verify in https://ai.google.dev/gemini-api/docs/
rate-limits + https://ai.google.dev/pricing), the free-tier rate limits
(RPM/RPD/TPM; ~10-15 RPM, ~1500 RPD for Flash per the 2026-10-28
research), and the `NARRATOR_MODEL` env var default.

## D-29 — Reserved: Google Search grounding — terms + display requirements

**Reserved** — the next session records: the grounding-terms decision
(required display elements e.g. `searchEntryPoint.renderedContent`,
storage/redistribution permissions, free-tier eligibility per
https://ai.google.dev/gemini-api/docs/grounding). Conservative default
until the next session has read the current terms in full: SHIP PART 3
DISABLED (`NARRATOR_WEB_CONTEXT=false`); the base A-section +
A-overall narratives work without grounding and ship first.

## D-30 — Reserved: Cloudflare Worker limits + the cron-rung design

**Reserved** — the next session records: the free-plan subrequest limit
(50/invocation — verify in Cloudflare's docs), the cron-trigger count
limit (5/Worker — the existing currena-api uses ONE: the minute cron;
no new cron trigger needed; the narrator runs as a new hour+minute-gated
rung), the CPU time per invocation, the free-tier KV ops/day (100k reads,
1k writes), and the design that stays within them (per-tick batch ≤3
model calls; pending list in KV; edge-cached endpoint so visitors do
not become KV reads).

## D-31 — Reserved: Region risk + the template-fallback default

**Reserved** — the next session records: the Cloudflare Worker egress
region for Google's Gemini API, the documented 403 "location not
supported" risk, the mitigations (`placement: { mode: "smart" }` hint
in wrangler.jsonc; Cloudflare AI Gateway; template fallback), and the
default (template fallback for the first week; switch to smart
placement if region errors exceed 1 in 5 A-generations).

## D-32 — Reserved: Section-list enumeration

**Reserved** — the next session records: the section list the narrator
generates for. Conservative plan (from `docs/insights/layer2/
RESEARCH-STARTER.md` §5): 4 sections + 1 overall = `['global',
'australia', 'world-markets', 'world-currencies']`. The `prices-board`
group is part of the `global` section (its indicators are already in
`section: 'global'`). The Markets snapshot feeds `world-markets`; the
FX snapshot feeds `world-currencies`.

## D-33 — Reserved: The secret-scan addition to `pnpm gates`

**Reserved** — the next session records: the secret-scan gate added as
gate 0 in `scripts/gates.mjs` (before typecheck). Scans the whole repo
+ tracked files for the Google key pattern `AIza[0-9A-Za-z_-]{35}` and
generic long secrets. Ensures `.dev.vars` and similar are git-ignored.
Fails `pnpm gates` on any hit. Documented in `docs/DEPLOY.md` per
spec §10.

## D-34 — Reserved: The staged-rollout visibility flag

**Reserved** — the next session records: `NARRATOR_VISIBLE` env var
default = `false`. Narratives are generated + stored but shown only in
preview (URL marker `?narrative=preview` works with the hash router).
The owner reads real text on the real page for ~1 week, then flips
visibility (one `wrangler vars` or `wrangler secret` update).

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

## D-36+ — Reserved: per-implementation decisions

**Reserved** — the next session records: the `PROMPT_VERSION` initial
value (likely 1); the validation check seed word lists (EN + FA banned
advice/certainty, jargon, attribution phrases); the per-fixture
assertions; any bundle-budget notes (D-16 path if the new web display
block pushes the Insights lazy chunk past 1100.00/260.00); and any
deploy-time findings (the currena-api version ID, the live-verification
screenshots path, etc.).
