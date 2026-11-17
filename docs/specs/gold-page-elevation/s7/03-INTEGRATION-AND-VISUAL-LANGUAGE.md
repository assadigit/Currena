> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S7/03 — Meter · Narrative · History: the Integration Spec + the Visual Language (M3)

**Session:** S7 of the Gold Page Elevation program (Phase B, session 2 of 2
before CP-B) · **Date:** 2026-11-17 · **Branch:** `docs/gold-page-elevation`

**What this is:** the integration design — how the balance hero (Zone C),
the F1 daily narrative (Zone D), and the F6 Episode Explorer (Zone O)
reference each other **without circularity** — plus the visual language
per relationship (per chain: which encoding, and why) with the
pre-registered-window registry. Four sections: **§1 the anchor graph**
(driver families → seats → cards → episodes); **§2 the narrative's
binding rules** (the GRAM translation); **§3 the episode data model**
(1971→present, the WGC prices-workbook drop, the asset-comparison table
riding its series); **§4 the visual language + the window registry** (the
do-not-copy list as constraints).

**Companion docs:** `s7/01` (the chain map — the per-chain decisions this
doc's grammar governs) and `s7/02` (the education layer). The S6 map
(`s6/01`), the copy rules (`s6/02` C1–C7), and the module map (`s6/03`)
are the containers this content lands in.

---

## 1. The anchor graph (driver families → seats → cards → episodes)

### 1.1 The graph, as a picture

```
                    ┌────────────────────────────────────────────────┐
                    │  the ONE page projection (single source of      │
                    │  truth: readings, lane counts, seat states,     │
                    │  deltas — served by /api/insights (gold page)   │
                    └───────────────┬────────────────────────────────┘
                                    │ read by (never written by)
        ┌───────────────┬───────────┼────────────────┬─────────────────┐
        ▼               ▼           ▼                ▼                 ▼
  C · the hero      D · F1       D · F4          G · the seats    every card
  (beam, verdict,   narrative   on-ramp          (lane cards,     (as-of,
  lane chips)       (families)  (drivers +       why-lines,        source)
        │               │        FAQ)           #18 links out)
        │               │           │                │
        └──── counts byte-identical (a test pins it; §2.4) ────┘

  DIRECTION OF REFERENCE (never circular):
  F4 drivers ──close-at──► lane cards ──seat list──► 37 seat cards
       │                                                     │
       │ #18 card-level hash ────────────────────────────────┘
       │ (seat card on /usa, /currencies, … : usa-card-real-yield-10y)
       │
       ├─(driver 4)──► K · the demand section (display-only; #gold-zone-k)
       │                    │
       │                    ├─(2022 annotation)──► O · F6 episode record
       │                    └─(companion chart §7/01§3)──► borrowing-costs seats
       │
       └─(fuel note)──► J/N · the COT cards

  F1 narrative ──(family sentences)──► the same lane cards + seats as the hero
       └─(demand clause, conditional)──► K (labelled display-only)

  O · F6 episodes ──("the indicators that told this story")──► today's seat
       cards + K + F (OUT-bound only; data cards never link back —
       education surfaces do: F4's examples, Zone F's interpretation,
       Zone K's annotation)

  F · the bridge interpretation ──► dollar lane card + Zone B (ounce)
       └─(C2 method block, self-contained)

  F12 · time machine ──► the readings archive, METER ERA ONLY (2016+);
       never renders a pre-2016 "verdict" (the boundary rule, §3.4)
```

### 1.2 The anchor-id contract (binding for Phase D)

| Surface | Anchor id family | Evidence / rule |
|---|---|---|
| Zone G lane cards | `#lane-borrowing-costs`, `#lane-dollar`, `#lane-stress`, `#lane-inflation`, `#lane-flows` | new ids on the gold page's own lane cards — the on-ramp's and narrative's primary closes |
| Destination-page cards (existing) | `usa-card-real-yield-10y`, `currencies-card-dollar-basket`, `usa-card-vix`, `usa-card-us-cpi-yoy`, `usa-card-breakeven-5y5y`, `usa-card-fed-expectations`, … | the #18 pattern (GPE-S2-18): card-level hashes verified present; **link text name-matches the card title** (the audit's name-mismatch finding) |
| Gold-page context cards | `#gold-card-gold-silver`, `#gold-card-cftc-gold-positioning`, … (one per context id) | new ids — the one-liners' and narrative's in-page targets |
| The new zones | `#gold-zone-d`, `#gold-zone-f`, `#gold-zone-h`, `#gold-zone-k`, `#gold-zone-o` | zone-level targets for cross-zone closes (driver 4 → K; the FAQ → M) |
| Episode records | `#episode-2022-rotation`, `#episode-1971-bretton-woods`, … (one per episode, §3) | the Zone K annotation's and the F4 examples' targets |
| The honest record | `#gold-honest-record` | FAQ Q4's close; the F4 governance note's close |

**The rules:** (1) every link in the education/narrative layer is an
anchor link to a *named, stable* target — no bare page links from F1/F4
(the #18 lesson); (2) link text always name-matches its destination (the
GPE-S2-18 second finding); (3) anchors are ids only — no behavioural
side effects; (4) the graph is **acyclic at the data layer** (§2) and
**one-directional at the reference layer** (data cards never link into
episodes; only education surfaces do — §1.1's rule). The engine/
presentation split (`s6/03 §2` rule 2) holds: the anchor builder is a
pure function in `gold-tiles.ts` (the existing `homePage` pattern,
extended), never string-concatenated in components.

### 1.3 What each node renders (the graph's payloads)

- **A lane card** (Zone G): lane word + counts + its seat list (the
  de-duplicated form per S6-D5) + the why-lines per dark seat (F16).
- **A seat card** (destination page): the reading, as-of, source, decile
  — unchanged; the anchor id is the addition.
- **A gold-page context card**: + its one-liner (`s7/02 §2`) + its
  anchor id.
- **An episode record** (Zone O): the record shape in §3.
- **The demand section** (Zone K): the display-only label + its own
  method block (C6's IMF row) — the graph's one "teaches, does not vote"
  node, labelled as such at the node.

---

## 2. The F1 narrative's binding rules (the GRAM translation)

**The intellectual template (S4/01 §2, recorded binding):** GRAM is a
statistical attribution — a regression decomposing monthly returns into
contribution shares. Currena's narrative must **never fake that
arithmetic**. The legitimate translation of GRAM's pattern is
*structural*: a daily story organized by the driver families, each
stating its observed firing state and the day's raw deltas, with the
explicit "the meter explains conditions, not the price move" caveat.
GRAM's "periods drivers do not fully explain returns" residual maps to
the `mixed`/`unreadable` lane words — the honest "we don't know" bucket.

### 2.1 The narrative's structure (the arc, binding order)

1. **The price fact** (the TE pattern, adopted; the forecast headline
   banned — C4): gold's own move, one month and one year of context,
   series and as-of named at point of use (C1: "XAUUSD, EODHD, as of
   …"). One sentence. No attribution language.
2. **The conditions families** (the GRAM translation): five family
   sentences in lane order (borrowing-costs, dollar, stress, inflation,
   flows) — each stating its **firing state** (the lane word + counts,
   byte-identical to the hero) and the **day's/week's raw deltas** from
   the seats that moved ("real 10y +0.26pp this week; DXY +1.9%").
   Deltas are facts about the seats, never shares of the price move.
3. **The conditional demand clause** (the sixth family, resolved): one
   sentence, present only when the demand data moved (a GDT release, a
   >2σ tracker month), always labelled «توضیحی، بدون رأی در برآیند» /
   "display-only, not a meter vote", linking to Zone K. *(This resolves
   the "five (six)" ambiguity in C7 rule 2 / S4/01 §2: five lane
   families always; the demand clause conditional and labelled.)*
4. **The caveat, standing**: "The meter explains conditions, not the
   price move" / «برآیند، شرایط را توضیح می‌دهد، نه حرکت قیمت را» —
   renders with the narrative every day (C7 rule 2), adjacent, never
   paragraphs away (the GPE-S2-11 distance lesson generalized).
5. **The closes**: each family sentence links its lane card; the price
   sentence links the Zone E chart; the demand clause links Zone K.

### 2.2 The wording rules (binding)

- **"Coincided with", never "because"** (Idea 1's risk note): the
  narrative states co-movement and conditions, never causation — "gold
  fell 0.6% while the two classic headwinds strengthened" not "gold fell
  because real yields rose".
- **No attribution percentages, ever** — no "X% of the move was real
  yields" (the no-fake-GRAM rule; the one *exact-arithmetic* exception
  is the bridge's identity decomposition, which is not the narrative's
  business — `s7/01 §8`).
- **No forecast language** (C4): no "expected to", no targets, no
  intensifiers (C3 clause 4's family).
- **Every number carries its series and as-of** (C1).
- **The `mixed`/`unreadable` words are the honest residual** — when
  families disagree or the data is dark, the narrative says so in the
  meter's own vocabulary; the template never averages away disagreement
  (the anti-GPE-S3-27 rule: no ungoverned template — the rules ARE the
  governance, and they render).
- **Regeneration + staleness**: the narrative is derived from the same
  snapshot as the meter (§2.4), date-stamped, and re-derived on ingest —
  a stale narrative is a stale card (fail-closed, dashes), never
  yesterday's prose presented as today's (Idea 1's aging risk).

### 2.3 The template's data path (the governance of the generator)

The narrative is a **pure derivation over the page projection**
(`domains/gold/narrative.ts`, `s6/03 §2`'s landing spot): the same
readings, lane counts, seat states and deltas the hero renders. The
template grammar is versioned in code with tests (`narrative.test.ts`):
every sentence pattern pinned against frozen scenarios (the
`gold-frozen-scenarios.test.ts` pattern), so the "auto-generated
narrative" can never drift from its own rules — the exact governance the
competitor lacks (GPE-S3-27), made testable.

### 2.4 The one-projection consistency rule (anti-circularity, part 1)

**The hero, the narrative, and the on-ramp's closes read one projection
and render byte-identical counts.** A consistency test pins: hero lane
counts = narrative family counts = on-ramp close counts = the seats
section's lane cards. No surface computes its own version. This kills
the circularity risk at the root: there is nothing to reconcile because
there is only one truth, and every rendering of it is pinned to the
others. (The F12 time machine reads the *historical* projections from
the readings archive — the same rule, different date: a past date's
narrative, if ever rendered, derives from that date's projection under
the *then-current* voter table, versioned per the repo's governance
docs.)

### 2.5 The direction-of-reference rules (anti-circularity, part 2)

1. **Meter → narrative, one way.** The narrative reads the meter's
   output; the meter never renders narrative state, never waits on it.
2. **Education → everything, outward.** F4's paragraphs, the FAQ, the
   Zone F interpretation, and the Zone K annotation link *to* lanes,
   cards, zones, and episodes. Data cards never link back into education
   (their links are: source-out, anchor-destination-in). One exception
   family, recorded: the one-liners may *name* a historical example in
   words (dated) without linking — the link lives in the education
   surfaces.
3. **Episodes → today, outward** (§3.5).
4. **The caveat is a constant**: every integration surface renders the
   conditions-not-forecast caveat family in its own grammar (the hero's
   existing line; the narrative's standing sentence; the episode
   records' framing; FAQ Q4) — the reader meets the same honesty at
   every depth.

---

## 3. The episode data model (F6 — 1971→present)

### 3.1 The episode record (the typed shape, binding)

```ts
interface GoldEpisode {
  id: 'episode-1971-bretton-woods' | …;        // the anchor id (§1.2)
  titleEn: string;  titleFa: string;            // drafts below
  period: { start: string; end: string };        // YYYY or YYYY-MM
  pricePath: { series: 'wgc-monthly-avg'; from: string; to: string };
    // renders from the prices-workbook drop; pre-1978 rows ride the
    // documented public-history values with the sourcing disclosed
  familyReadings: Array<{
    family: 'borrowing-costs' | 'dollar' | 'stress' | 'inflation'
          | 'flows' | 'demand';
    hasData: boolean;                            // the honesty flag
    seriesNamed?: string;                        // e.g. 'DXY (1971+)'
    readingEn: string; readingFa: string;        // 1-2 sentences, dated
  }>;
  interpretationEn: string;  interpretationFa: string;  // one paragraph,
    // honest, sourced, dated — no counterfactuals, no "should have"
  sources: Array<{ name: string; url?: string; licence: 'L1'|'L2' }>;
  links: Array<{ target: string; label: string }>;  // OUT-bound only (§3.5)
}
```

**The `hasData` flag is the model's honesty core:** the meter did not
exist before 2016, and the *families'* own series start at different
dates (TIPS real yields 1997+; DXY 1971+; CPI 1913+; the flows family's
CFTC series 1986+; the demand family's WGC series 2002+ quarterly, the
IMF monthly series 2010s coverage-varies). An episode never renders a
family reading it cannot source — the empty family renders "no series
for this family in this period" («برای این خانواده در این دوره سری
داده‌ای نیست»), the same fail-closed grammar as a dark seat.

### 3.2 The episode list (the launch set, nine records)

1971 Bretton Woods end · 1980 the Volcker peak · 1999 Brown's bottom ·
2008 the GFC · 2011 the QE-era top · 2013 the taper tantrum · 2020
COVID · **2022 the sanctions rotation** · 2024–26 the melt-up and
correction. (Idea 4's list, unchanged — the 2022 record is the Zone K
annotation's target and the on-ramp's recurring example.) FA title
drafts: «پایان برتون‌ودز ۱۹۷۱»، «اوج ولکر ۱۹۸۰»، «کف براون ۱۹۹۹»،
«بحران مالی ۲۰۰۸»، «سقف دوران تسهیل‌کمی ۲۰۱۱»، «تشنج کاهش تدریجی
۲۰۱۳»، «کرونا ۲۰۲۰»، «چرخش تحریمی ۲۰۲۲»، «صعود و اصلاح ۲۰۲۴-۲۶».

### 3.3 The series (the WGC prices-workbook drop + the riders)

- **The price spine:** the WGC currency-averages workbook (monthly
  averages since 1978; `Gold_price_averages_in_a_range_of_currencies_
since_1978.xlsx`, S4/01 §1 row 1) via the data-drop pattern (S4-D2):
  dated file in `data/wgc/`, attribution "Source: World Gold Council"
  per C6, only derived numbers render publicly. Pre-1978 episodes
  (1971) ride documented public-history values, sourced per record
  (Idea 4's licensing note: LBMA historical is licensed — avoided; the
  FRED long-run supplement was S4-deferred with reason).
- **The asset-comparison table rides the same spine** (the S3-matrix
  row, disposed to F6 scope): gold vs S&P vs BTC vs silver over
  1/5/10/20y windows (and since-episode returns per record), all series
  in-repo or public (F26's verified family), the honest footnote family
  SA also ships («بازده گذشته تضمینی برای آینده نیست») plus Currena's
  addition: the window named at point of use per C1, and the decile
  framing where a 10y history exists (F26's own differentiator).
- **The family riders:** each episode's family readings cite their own
  series by name and start date (§3.1) — DXY for the dollar family, the
  CPI for inflation, and so on, all already-ingested families.

### 3.4 The meter-era boundary (the anti-synthesis rule, binding)

**The Episode Explorer teaches the chains, not the meter, before 2016.**
No episode record renders a historical "meter verdict", lane count, or
beam — those exist only where the readings archive exists (2016+, the
backtest harness's corpus), and the F12 time machine is the *only*
surface that renders historical meter states (its own governance: the
voter-table version of the date, per `GOLD_SYSTEM_COMPLETE_REFERENCE`'s
versioning). The 2016+ episodes (2020, 2022, 2024–26) may additionally
cite what the meter *actually said* at the time — sourced from the
archive, dated, versioned — which is the time-machine honesty made
editorial: "conditions were X when the price did Y; the backtest says
conditions ≠ forecast" (the Idea 2 framing, inside F6). The boundary is
a hard rule: **no fake historical verdicts, ever** — the page's brand is
the honest record, and the episode model extends it backward.

### 3.5 The episode links (out-bound only)

Each record links to: the live seat cards of the families that told its
story (e.g. 2022 → the real-yield card, the Zone K tracker, the Zone F
bridge's premium history when Bridge-2 lands); the Zone K companion
chart (the 2022 record and the chart annotate each other); and, for
2016+ records, the F12 time-machine date (rendered by the time machine,
not by the episode — the direction rule). Data cards never link into
episodes (§2.5 rule 2).

**Editorial maintenance:** the records are a typed static module
(`s6/03 §2`'s `GoldEpisodes.tsx` + the episode data), facts sourced and
dated at write time (Idea 4's risk note), near-zero maintenance once
written (evergreen content). The 2024–26 record is the one living
record: its "correction" leg updates until the episode closes, with the
update rule that interpretation copy changes are dated edits, never
silent rewrites (the TGJU revision lesson, applied editorially).

---

## 4. The visual language per relationship + the pre-registered-window registry

### 4.1 The encoding vocabulary (why each form, per chain)

| Encoding | What it asserts | Used for | Why this form (and not the alternatives) |
|---|---|---|---|
| **Dual-axis + correlation strip** | two series, one relationship, *changing over time* | Chain 1/4 (the Zone K companion, `s7/01 §3`) | the lesson is the relationship's *time structure* — a scatter compresses time out (rejected, `s7/01 §3`); a single number hides the break (the competitor's −0.13, GPE-S3-05); the strip carries the quantitative claim so the axes never argue causation |
| **Annotation marker/band** | a dated event or regime break | the 2022 rotation (companion + tracker); the episode records; the TA cross events | the page's grammar is *dated facts* — annotations date the break and link to the record; shading-only bands (no link, no date) are banned (the un-anchored-visual anti-pattern) |
| **Decomposition stack** | an identity's components | F5 (nominal = real + breakeven + term premium); the bridge's parity rows (ounce × FX × content) | the chain IS an identity; the stack renders the mechanism exactly; each leg named + as-of'd (C1); the reading rides the *configuration*, not a level |
| **Percentile band / decile** | statistical position vs history | the distance-from-200DMA decile; F14's COT bands; the multi-currency local deciles; the real-price card (existing); Bridge-2's premium deciles | the page's native grammar (top-N% of the decade); honest about "high vs history" without trend-reading; the mid-range lesson taught inline (Chain 6) |
| **Event list (dated)** | what happened, and what followed | TA crosses (whipsaws included); the episode records; the F16 why-lines | symmetric with the backtest-honesty culture: events with outcomes, failures included; never a signal matrix |
| **Small multiples grid** | one asset, many numeraires | F10 (gold in 6 currencies) | the dollar-chain lesson is per-currency *position*, best compared side-by-side; one chart per currency would fragment; a single USD chart cannot show it at all |
| **Prose + cross-links** | mechanism and exception, where data already renders | Chain 5 (the gap reading); Chain 7 (the physical cards' shared line); the lanes; the FAQ | when the cards already carry the data, a synthesized chart restates without informing (`s7/01` rule 1); the exception belongs in sentences, where its conditions can be stated |

### 4.2 The pre-registered-window registry (binding; changes are recorded decisions)

| Statistic | Window | Sampling / basis | Registered in |
|---|---|---|---|
| The companion's rolling correlation | 52-week rolling Pearson | weekly **Friday** closes, *levels*, gold = XAUUSD daily closes (EODHD), real yield = 10y TIPS (DFII10 / Treasury-direct [default]) | this row + `s7/01 §3` |
| The companion's display window | trailing 10 years | daily closes displayed; the strip over the same window | this row + `s7/01 §3` |
| Every decile/percentile on the page | 10 years | the page's native `percentile10y` grammar, daily unless the series is weekly/monthly (COT: weekly vs its own 10y history) | the page's existing convention, restated |
| F14's COT bands | 10 years | the CFTC weekly report series, net + gross-long vs own history | this row + `s7/01 §7` |
| The F10 local deciles | 10 years | XAU-cross daily closes per currency | this row + `s7/01 §4` |
| The narrative's deltas | day and week | the seat readings' own cadence; the window named in the sentence when it matters ("this week") | `s7/03 §2` |
| The 30-day reality bar | \|30-day move\| ≥ 2% | the meter's own `GOLD_REALITY_SPEED_PCT` (unchanged) | `gold-score.ts`, cited |

**The rule (C1's extension, binding):** a statistic whose window or
sampling is not in this registry does not ship; changing a registered
value is a recorded decision (the program's discipline), never a silent
re-tune — the anti-GPE-S3-05 rule made procedural. Where a number is
convention-sensitive, the panel says so *as the reason the window is
printed* (the companion's footer, `s7/01 §3`).

### 4.3 The do-not-copy list, mapped to enforcement (matrix §5)

| Do-not-copy item | Enforcement in this framework |
|---|---|
| Commerce funnels on the data surface | the graph's nodes are data + education only; no CTA renders inside any zone (the S6 map has no commerce zone) |
| The ungoverned narrative template | §2's binding rules + the versioned template grammar with pinned tests (§2.3) — the governance renders with the prose |
| Mixed spot/futures conventions | C1 + the registry: every series named at point of use; the TA block names XAUUSD daily closes at its header (C5); the companion names both legs on its face |
| Mixed timezone presentation | the market-state pill names its market + zone (Zone B, F16's scope note); F25's strip names the zone at point of use (`s6/03` D rule) |
| Month-only short-range axis labels | the F7 chart spec inherits the unit-aware header (S4/02 §2c) and full date ticks at short ranges — an S8 chart-spec line, recorded here as the constraint |
| Prior-close values unlabeled beside live | the bridge's Tehran rows stamp as-of per row (C2 rule 3); no card mixes vintages unlabeled |

## 5. What this integration costs and carries (for S8)

**New work, all inside the locked scope:** the narrative engine (a pure
derivation + template, versioned, tested); the anchor-id additions
(lane/zone/card/episode ids — the `gold-tiles.ts` builder extension);
the episode static module + the prices-workbook adapter (the data-drop);
the consistency test family (hero = narrative = on-ramp = seats). **Zero
new data families** beyond the adopted drops. The F12 API surface is the
one S8 sizing item this spec depends on (§3.4's boundary is designed to
work whether F12 lands in wave 4 or later — the 2016+ episodes cite the
archive through it, or omit the citation until it exists).

**Carried, cited, not re-litigated:** the fix-first three + the why-lines
= wave 0 (`s6/01 §3`); the two operational P0s = the
modularization-closeout window (S2-D4); S3-D1 (explanation co-equal
Core); the CP-A defaults (S6-D8) — Treasury-direct **[default]** at its
two touchpoints (the companion's real-yield leg, the F5 inputs), the
gerami pin **[default]** in the bridge constants.

## 6. Method and limitations

The integration rules consolidate and extend the recorded binding
decisions (S4/01 §2's GRAM translation; C7 rules 2–4; the S6-D2
display-only rule; the #18 pattern) into a testable spec: the
one-projection rule, the direction rules, and the registry are all
pin-able in Phase D. The anchor graph was designed against the verified
#18 infrastructure (card-level ids exist on destination pages, verified
S2; the lane/zone/episode ids are new and land with their components).
The episode model's series-availability claims (TIPS 1997+, DXY 1971+,
CFTC 1986+) are the standard publication histories of those families —
each episode record re-verifies its own series' start against the
ingested data at write time (Phase D editorial task), and any that fails
renders the `hasData: false` row honestly. Nothing was implemented
(standing constraint); the FA strings are drafts for the manifest
rounds; the wave tags restate S5-D2 with S8 owning the final cut.
