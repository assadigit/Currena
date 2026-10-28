# The section-state contract (M1, narrator build)

**Functions** — `packages/insights/src/narrator/section-state.ts` +
`overall-state.ts`, exported from `@currena/insights/narrator`:

- `buildSectionNarrationState(snapshot, sectionId, now)` — one section's
  narration state.
- `buildOverallNarrationState(snapshot, now)` — the whole page's.
- `stateHashOf(state)` — the content hash the generation cycle (spec §4)
  compares to skip unchanged units (the run clock and age hours are
  stripped; every value, status, count, label, date and freshness flip
  stays).

Pure, typed, tested: no I/O, no clock reads, no KV, no fetch, **no model
calls**. Every verdict/signal/tier is the document's OWN computed value,
verbatim — the only arithmetic is the age math (the freshness module's
discipline) and counting (the math decides; the AI only explains).

**The sections (D-32):** `global` · `australia` (the insights snapshot's
readings, sliced by their definitions' `section`) · `world-markets` (the
`insights:markets:v1` document) · `world-currencies` (the `insights:fx:v1`
document) — plus the `overall` rollup. The prices-board group is part of
`global` (its indicators are `section: 'global'`).

**Golden fixtures** (pinned by `section-state.test.ts`):
`packages/insights/fixtures/narration/sections/` —
`global-live` · `australia-live` (the live stressed day, 2026-10-28) ·
`australia-calm` (the calm prep fixture's input) · `australia-excluded`
(the stale-excluded prep fixture's input) · `world-markets-live` (live:
signal attention, 6 corrections + 1 bear) · `world-currencies-live`
(live: r6 warning, EUR/CHF unusual move) · `overall-live` (all three live
documents). Each is `{scenario, section, description, provenance, now,
input, output}`. Regenerate with
`pnpm --filter @currena/insights exec tsx scripts/build-narrator-section-fixtures.ts`
(after capturing the three live documents to `/tmp/live-*.json` — see the
script header; only on an intentional contract change).

---

## The input

```ts
interface SectionNarrationSnapshot {
  insights: InsightsSnapshot;   // always (the /api/insights document)
  fx?: FxSnapshot;              // the FULL /api/insights/fx document
  markets?: MarketsSnapshot;    // the FULL /api/insights/markets document
}
```

`now` is a separate parameter (ISO datetime): the narrator's own clock.

## The output — the shared fields

```ts
interface SectionNarrationStateBase {
  section: 'global' | 'australia' | 'world-markets' | 'world-currencies';
  label: { en: string; fa: string };        // existing UI strings (via the
                                            // generated vocabulary snapshot)
  generatedAt: string;                      // = the `now` parameter
  dataAsOf: { oldest: string | null; newest: string | null };
                                            // oldest/newest asOf among the
                                            // section's FRESH items
  verdict: SectionVerdict | null;           // the section's existing verdict
  tiers: Record<string, number>;            // per-kind tier counts (below)
  alerts: SectionAlert[];                   // firing alerts (per kind, below)
  patterns: SectionPattern[];               // world-currencies only; [] elsewhere
  excluded: SectionExcluded[];              // stale/unavailable, with reasons
}

interface SectionVerdict {
  label: string;                            // the engine's own label, verbatim
                                            // ('stressed' | 'attention' | ...)
  word: { en: string; fa: string };         // the page's approved word for it
  counts: Record<string, number>;           // the rollup's own numbers
  worstGroup?: { id; label: {en, fa} };     // world-markets only
  headlineRule?: string | null;             // world-currencies only
}

interface SectionAlert {
  id: string;
  tier: 'needs-attention' | 'correction' | 'bear' | 'unusual-move';
  direction: 'rising' | 'falling' | 'flat';
  magnitude: { value: number; unit: 'points' | 'percent'; window: string } | null;
}

interface SectionPattern {                  // an alerting fx rule outcome
  id: string; tier: 'warning' | 'watch'; counted: boolean;
  direction: 'rising' | 'falling' | 'flat';
  magnitude: { value: number; unit: 'percent'; window: string } | null;
  line: number | null;                      // the crossed warning line
}

interface SectionExcluded {
  id: string; reason: 'stale' | 'unavailable'; section: NarratorSectionId;
  asOf: string | null; ageHours: number | null; cadence?: string;
}
```

## The output — the per-section items + tiers

**global / australia** (`IndicatorSectionState`): `items` are the P4
`NarrationItem`s of the section (id, status, section, voting, value, asOf,
ageHours, cadence — the freshness-partitioned fresh set; excluded readings
land in `excluded` with their reason). `tiers` counts the statuses over the
fresh items: `warning · normal · context · no-history · check-pending`.
`alerts` are the section's warning-status readings (tier
`needs-attention`, the P4 plain magnitudes). `patterns` is always `[]`
(fx patterns belong to the currencies section). `verdict` is the
snapshot's own summary line: label + the approved word
(`Stable/Cautious/Stressed/Critical` · `پایدار/احتیاط/پرتنش/بحرانی`) +
`{warningCount, votingCount, excludedCount}`; `null` when the line's label
is null.

**world-markets** (`MarketsSectionState`): `items` are the fresh rows —
`{id, group, status, trend, value (close), asOf, ageHours, chg3m,
fromHigh}` (a row whose own `stale` flag is set lands in `excluded`).
`tiers` counts `normal · correction · bear`. `alerts` are the
correction/bear rows — tier `correction`/`bear`, direction from the row's
trend, magnitude `{fromHigh, percent, 'from-52w-high'}`; ordered bear
first, then id. `statusWords` carries the page's approved words for the
two alerting statuses (both languages) — the state's own words the
narrative may restate (V5 exempts them). `verdict` is the markets summary
verbatim: signal + word (`Normal/Needs attention/Unusual` ·
`عادی/نیازمند توجه/غیرعادی`) + `{count, roseToday, nAttention, nUnusual}`
+ `worstGroup` when set.

**world-currencies** (`CurrenciesSectionState`): `items` are the fresh
pairs — `{id, rate, asOf, ageHours, chg1m, moveRank, bigMove}` — with the
fx document's own dollar measure riding FIRST as `dollar-basket` (the
page's dollar-basket vocabulary entry names it; it goes stale by the fx
board's own 5-day rule). `tiers` counts the rule outcomes: `warning ·
watch · supportive · quiet · context · nodata`. `alerts` are the
warning-outcome rules (tier `needs-attention`, the met leg's value as
plain magnitude) followed by the big-move pairs (tier `unusual-move`,
`{chg.m1, percent, '1m'}`). `patterns` are the warning/watch rules with
their met leg's value + line. `verdict` is the fx summary verbatim:
signal + word + `{countedWarnings}` + `headlineRule`.
`dollarYearExtreme` carries the document's own `plain` block value when
present.

## The overall state

```ts
interface OverallNarrationState {
  generatedAt: string;
  sections: OverallSectionEntry[];   // the four, in page order (D-32):
                                     // { section, label, present, verdict,
                                     //   alertCount, itemCount, excludedCount }
                                     // (present: false when the feed document
                                     //  was not provided)
  alerts: (SectionAlert & { section })[];   // EVERY firing alert across
                                            // sections, section order then the
                                            // section's own order
  patterns: SectionPattern[];               // the currencies patterns
  excluded: SectionExcluded[];              // the union, id-sorted
  dataAsOf: { oldest; newest };             // across ALL sections' fresh items
}
```

RULE (spec §3): the AI never reads AI output — the overall narrative is
generated from THIS state, never from section texts. "The top few alerts"
is what the PROMPT asks the model to name; the state carries all of them
(each tagged with its section) so the choice is the model's, from facts —
no cap is imposed and no severity ordering is invented (logged, D-32).

## Invariants (all test-pinned)

- Items and excluded partition the section's own readings; an id never
  appears in both; excluded ids never appear in alerts.
- Every alert id is one of the section's items (or, for currencies, an
  active rule id).
- Verdicts/labels/words are the documents' own values / existing UI
  strings (the generated vocabulary snapshot — drift-gated).
- Arrays are deterministically ordered (id-sorted; the markets/fx alerts
  carry their section's own tier order first; the overall alerts carry
  section order first).
- `stateHashOf` is stable across runs with unchanged content, ignores
  `generatedAt` + `ageHours`, and changes on any content change.
- The AU trio still rides as monthly data with its own asOf (D-21 flows
  through the slice unchanged).

## How the narrator uses it (M2+)

1. `buildSectionNarrationState(snapshot, section, runTime)` per section +
   `buildOverallNarrationState(snapshot, runTime)`.
2. `stateHashOf(state)` per unit — regenerate only when the hash changed
   or the text is older than 24 h (spec §4; the cron rung, M4).
3. The prompt (M2) receives `SCOPE`, `STATE` (this JSON), `VOCABULARY`
   (`getNarratorVocabulary` over the state's ids) and `GLOSSARY` (the
   subset's own terms).
4. The validators (M1, `validate.ts`) hold any output — model or template
   — to exactly what this state says: V3's allowed numbers are the
   state's numbers (+ the provided vocabulary's own, e.g. tenor names),
   V7's permitted names are the state's ids, V10's out-of-date clause
   tracks `excluded`.
