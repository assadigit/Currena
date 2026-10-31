# The narration input contract (P4)

**Function:** `buildNarrationState(snapshot, now)` —
`packages/insights/src/narrator/state.ts`, exported from
`@currena/insights/narrator`. Pure, typed, tested; no I/O, no clock
reads, no KV, no fetch, **no model calls** (Layer 2 decides what to do
with this JSON).

**What it is:** the small JSON the future narrator receives — a pure
projection of the ALREADY-COMPUTED page state. It never re-derives a
verdict, a status or a change (the math decides; the AI only explains);
the only thing it computes is P1 freshness, from the same thresholds the
status engine uses (`freshness.ts`, D-20/D-21).

**Golden fixtures** (pinned by `src/narrator/state.test.ts` — any
unnoticed contract change fails the tests):
`packages/insights/fixtures/narration/{stressed-live,calm,stale-excluded}.json`
— each `{scenario, description, provenance, now, input, output}`. The
stressed day is REAL live data (captured from currena.ir on
2026-10-28); the calm and stale-excluded days are constructed from it
(statuses/dates edited, summaries recomputed with the real
`summarizeByGauges`).

---

## The input

```ts
interface NarrationSnapshot {
  insights: InsightsSnapshot;   // the /api/insights document as served
  fx?: {                        // the /api/insights/fx document's fields (optional)
    generatedAt: string;
    rules: ReadonlyArray<Pick<FxRuleState, 'id' | 'outcome' | 'counted'>>;
    summary: FxSummary;         // { signal, countedWarnings, headlineRule }
  };
}
```

`now` is a separate parameter (ISO datetime): the narrator's own clock.
Layer 2 will pass its run time; the fixtures pass frozen clocks.

**gap-closure S2-M2.5 (PROMPT_VERSION 9):** the section-state builder's
input (`SectionNarrationSnapshot`) also accepts `tic?: TicSnapshot` —
the `/api/insights/tic` document as served. When present, the GLOBAL
section's state carries a compact `tic` block (the page's OWN derived
numbers: `dataMonth`, `totalTn`, the Japan/China six-month changes and
12-month net TRANSACTIONS sums, the top-3 12-month buyers/sellers, and
the `custodyNote` the model must keep). The narrator cron reads
`insights:tic:v1` beside the other documents (one more KV read on the
:50 rung); a missing key degrades calmly to `tic: null` — the narrative
renders without the facts. Australia and the world sections always
carry `tic: null`. The template fallback renders the total + the two
headline holders' six-month changes (conditions only, both languages).

## The output — field by field

```ts
interface NarrationState {
  generatedAt: string;                       // = the `now` parameter
  dataAsOf: { oldest: string | null; newest: string | null };
                                             // oldest/newest asOf among FRESH items
  verdict: { global: SummaryLine; australia: SummaryLine };
                                             // the snapshot's own summary lines, VERBATIM
  fxSignal: { signal: 'normal'|'attention'|'unusual';
              countedWarnings: number; headlineRule: string | null } | null;
                                             // the fx document's own rollup; null when fx absent
  alerts: NarrationAlert[];                  // warning-status readings, sorted by id
  patterns: NarrationPattern[];              // fx rules with outcome warning/watch, sorted by id
  items: NarrationItem[];                    // FRESH readings only, sorted by id
  excluded: NarrationExcluded[];             // stale/unavailable readings, sorted by id
}

interface NarrationAlert {
  id: string;
  tier: 'needs-attention';                   // the page's word for a firing warning (v3 §4)
  direction: 'rising' | 'falling' | 'flat';  // from change30d (fallback moveScore)
  magnitude: {                               // ONE plain number — never a raw dump
    value: number;                           // change30d, rounded to 2 decimals
    unit: 'points' | 'percent';              // the definition's changeKind
    window: '30d' | 'since-previous-release';// the page's own change-window rule per cadence
  } | null;                                  // null when the reading carries no finite change
}

interface NarrationPattern { id: string; tier: 'warning' | 'watch'; counted: boolean; }

interface NarrationItem {
  id: string;
  status: 'warning' | 'normal' | 'context' | 'no-history' | 'check-pending';
  section: 'global' | 'australia';
  voting: boolean;                           // gauge membership (the verdict electorate)
  value: number | null;
  asOf: string;
  ageHours: number;                          // whole hours from asOf (00:00 UTC) to `now`
  cadence: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'per-change' | 'manual';
                                             // the REFINED cadence (D-21: the AU trio reads
                                             // monthly while the daily RBA path is blocked)
}

interface NarrationExcluded {
  id: string;
  reason: 'stale' | 'unavailable';           // freshness reason (asOf null ⇒ unavailable)
  status: IndicatorReading['status'];
  asOf: string | null;
  ageHours: number | null;
  cadence: IndicatorDefinition['cadence'];
}
```

**Invariants (all test-pinned):**
- `items` + `excluded` partition the snapshot's readings exactly (100 =
  100 today).
- An id NEVER appears in both `items` and `excluded`, and `excluded`
  ids never appear in `alerts`.
- `dataAsOf` spans the fresh items only — excluded data never sets the
  page's data horizon.
- `verdict` is byte-identical to the snapshot's own summary lines.
- Every array is sorted by id (stable serialization; the fixtures pin
  the exact JSON).
- No model call, no prompt, no key — this is preparation only.

## The three examples (from the golden fixtures, 2026-10-28)

### 1. A stressed day — `stressed-live.json` (REAL live data, unedited)

```jsonc
{
  "generatedAt": "2026-10-28T04:20:18.253Z",
  "dataAsOf": { "oldest": "2026-04-01", "newest": "2026-10-28" },
  "verdict": {
    "global":     { "section": "global",    "label": "stressed", "warningCount": 9, "votingCount": 32, "excludedCount": 0 },
    "australia":  { "section": "australia", "label": "stressed", "warningCount": 7, "votingCount": 16, "excludedCount": 0 }
  },
  "fxSignal": { "signal": "attention", "countedWarnings": 1, "headlineRule": "r6_europe_worry" },
  "alerts": [
    { "id": "au-10y",  "tier": "needs-attention", "direction": "rising",
      "magnitude": { "value": 0.27, "unit": "points", "window": "30d" } },
    { "id": "au-cpi",  "tier": "needs-attention", "direction": "rising",
      "magnitude": { "value": 0.37, "unit": "points", "window": "since-previous-release" } },
    // … 14 more (16 total: 9 global + 7 australia)
  ],
  "patterns": [ { "id": "r6_europe_worry", "tier": "warning", "counted": true } ],
  "items": [
    // 100 fresh items, e.g.:
    { "id": "au-10y", "status": "warning", "section": "australia", "voting": true,
      "value": 5.283, "asOf": "2026-09-30", "ageHours": 676, "cadence": "monthly" },
    // … (a monthly RBA series narrated with its own date — never as a live daily print)
  ],
  "excluded": []
}
```

### 2. A calm day — `calm.json` (constructed: every warning calmed, summaries recomputed)

```jsonc
{
  "generatedAt": "2026-10-28T04:20:18.253Z",
  "dataAsOf": { "oldest": "2026-04-01", "newest": "2026-10-28" },
  "verdict": {
    "global":     { "section": "global",    "label": "relaxed", "warningCount": 0, "votingCount": 32, "excludedCount": 0 },
    "australia":  { "section": "australia", "label": "relaxed", "warningCount": 0, "votingCount": 16, "excludedCount": 0 }
  },
  "fxSignal": { "signal": "normal", "countedWarnings": 0, "headlineRule": null },
  "alerts": [],
  "patterns": [],
  "items": [ /* 100 fresh items — values, dates and changes untouched */ ],
  "excluded": []
}
```

### 3. A day with excluded stale data — `stale-excluded.json` (constructed: the AU trio frozen 75 days + one unavailable reading)

```jsonc
{
  "generatedAt": "2026-10-28T04:20:18.253Z",
  "dataAsOf": { "oldest": "2026-04-01", "newest": "2026-10-28" },
  "verdict": {
    "global":     { "section": "global",    "label": "stressed", "warningCount": 9, "votingCount": 32, "excludedCount": 0 },
    "australia":  { "section": "australia", "label": "stressed", "warningCount": 5, "votingCount": 13, "excludedCount": 3 }
  },
  "fxSignal": { "signal": "attention", "countedWarnings": 1, "headlineRule": "r6_europe_worry" },
  "alerts": [ /* 14 — the two AU warning voters left the electorate with their data */ ],
  "patterns": [ { "id": "r6_europe_worry", "tier": "warning", "counted": true } ],
  "items": [ /* 96 fresh items */ ],
  "excluded": [
    { "id": "au-10y",         "reason": "stale",      "status": "stale",
      "asOf": "2026-08-14", "ageHours": 1804, "cadence": "monthly" },
    { "id": "au-us-10y-gap",  "reason": "stale",      "status": "stale",
      "asOf": "2026-08-14", "ageHours": 1804, "cadence": "monthly" },
    { "id": "rba-expectations", "reason": "stale",    "status": "stale",
      "asOf": "2026-08-14", "ageHours": 1804, "cadence": "monthly" },
    { "id": "wti",            "reason": "unavailable", "status": "unavailable",
      "asOf": null, "ageHours": null, "cadence": "daily" }
  ]
}
```

## How Layer 2 is expected to use it

1. Read the snapshot (+ fx document) from the same KV keys the API
   serves (`insights:snapshot`, `insights:fx:v1`) — no new KV reads
   beyond what a scheduled job already does; report any additions per
   the free-tier rule.
2. `buildNarrationState({ insights, fx }, runTime)`.
3. `getNarratorVocabulary(ids, lang)` where `ids` = the state's alert
   ids + pattern-relevant ids + any items the narration will name (the
   vocabulary subset keeps connections and glossary terms coherent with
   exactly that set).
4. Hand the model: the narration state + the vocabulary subset. The
   state already carries everything the model may state as fact;
   excluded data must be described as excluded, never explained as
   current.

**Regenerating the fixtures** (only when the CONTRACT intentionally
changes — update state.ts, the tests, and the fixtures together):
capture the two live documents, then run
`pnpm --filter @currena/insights exec tsx scripts/build-narration-fixtures.ts`
(see the script header; the tests never hit live sites).
