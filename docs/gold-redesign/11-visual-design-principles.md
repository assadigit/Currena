# Gold Page Redesign — Session 4: Visual Design Principles

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

**Session:** 4 of 9 — Visual system and metric-to-visual mapping (`CURRENA_GOLD_UX_STRATEGY_AND_PHASED_PLAN.md` §10, Session 4)
**Mode:** Design specification and prototype/reference work. No broad production implementation; no financial-model logic, data sources, ingestion, provider requests, or production behavior changed (master plan §9.3 — held; nothing under `apps/` or `packages/` was touched this session).
**Date:** 2026-11-2x
**Companion deliverables:** `12-visualization-mapping.md` (the 68-row metric→visual map + the difficult cases + the explorer and outlook specs) · `visual-references/` (the pattern sketch sheet + PNG captures + README) · `DECISION_LOG.md` (S4-D1…S4-Dxx appended; S1's and S3's entries untouched)
**Inputs consumed (never rewritten):** the master plan §2–§2.2 (locked owner decisions), §3 (interpretation rules), §6 (visual framework), §7 (responsive/interaction), §8 (data states), §10 Session 4 brief; the S1 evidence (`01-current-state-audit.md` F-01…F-14, `02-section-and-component-map.md`, `04-duplicate-and-overlap-matrix.md`, `baseline-screenshots/`); the S3 content foundation (`08-indicator-content-schema.md` — the 68-row registry and tiers; `09-indicator-explanations-fa-en.md` — every record's `dataType`/`unit`/`referencePeriod`/`visualReading`; `10-indicator-relationship-map.md` — the M/C/X/K taxonomy and the explorer contract); and the shipped design system itself (`apps/web/src/index.css` 2,859 lines read end-to-end, `lib/theme.ts`, the full `features/gold/**` component set — the inspection log is §2 and the visual-references audit).

---

## 1. Purpose and the one-sentence system

This document defines the **visual language** for the redesigned `/gold` page: the art direction, the color/status semantics, the one-system grammar that binds the five lanes to the aggregate balance, the metric anatomy (position, history, range, unit, period, freshness, uncertainty), the default/expanded indicator patterns, the chart accessibility and bilingual rules, the truth rules for metaphors, and the budget strategy.

The system in one sentence:

> **An editorial-analytical briefing: one brass instrument explains the verdict, five flat lane bars explain the instrument, and every metric below answers in a small closed vocabulary of honest analytical marks — a range band, a signed bar, a line with a named window — never a generic gauge, never color without a word.**

Everything in this document derives from four locked owner decisions: professional market intelligence (decision 22), the right visual per concept rather than one chart type forced on everything (decision 23/§2.1), green = supports gold / red = pressures gold with neutral/mixed and unavailable distinct (decision 24/§3.6), and visuals lead while numbers stay visible where they matter (decision 25).

**The Session-2 note carried forward (S3-D1):** the placement/architecture deliverables (05/06/07) still do not exist. This session therefore specifies the visual system **against the master plan §4's twelve-section architecture** and the current surfaces (as S3's records do), and every placement-dependent wording is flagged for reconciliation if Session 2 ever runs. Nothing here depends on 05/06/07 existing; the visual forms attach to indicator records (by canonical id) and to module records, not to layout slots.

---

## 2. The foundation — what the shipped system already gives us (the inspection, task 1)

The redesign **builds on** the shipped design system; it does not replace it. The full token inventory was read from `apps/web/src/index.css` (2,859 lines) and the component set. What we keep, verbatim or with light consolidation:

### 2.1 Keep as-is (the system's strengths)

1. **The Insights token set** — the dual text ramp (`--color-text-primary/secondary/tertiary`, all ≥ 7:1 in both themes), `--color-surface` / `--color-surface-raised`, `--color-border`, and the four type roles (`.type-verdict` 1.6rem/800 · `.type-number` 1.45rem/800 tabular · `.type-label` 14px/600 · `.type-caption` ~12.5px/500). These already encode the "editorial financial publication" restraint the art direction needs.
2. **The Carbon-pinned status palette** (owner-era round 24) — `--color-status-normal #24a148` · `--color-status-watch #f1c21b` · `--color-status-stressed #ff832b` · `--color-status-alert #da1e28` (light) / `#fa4d56` (dark) — with the darker **chip-ink siblings** that put pill text at ≥ 4.5:1. This is the semantic base of the gold-impact vocabulary (§5).
3. **The signed-return vocabulary** — `--color-return-up #00873A`/`#30D96B` · `--color-return-down #E51527`/`#FF5963`, always with sign + triangle. The status-vs-return split (calm state hues for *conditions*; loud signed hues for *an indicator's own change*) is exactly the two-channel grammar the mapping needs, and it is preserved as a hard rule (§5.4).
4. **The "never color alone" discipline** — impact always pairs color with a state word and an icon/shape; returns always pair hue with sign + triangle; every decorative element carries an aria-hidden twin with the words. System-level invariant, kept and extended.
5. **The house chart grammar** — zero chart dependencies; one stretched SVG for geometry + all text as HTML around it (glyphs never distort); `dir="ltr"` chart roots ("charts read left→right in both locales — common Persian financial-chart convention"); hover inspector + keyboard walk; series and as-of named at point of use; spans computed from data, never a fixed label over a different span. Every new visual in §12 of the mapping doc conforms to this grammar.
6. **The balance's fidelity ladder** — the same net-lean metric already renders at three fidelities: the full brass instrument (hero) → the minimal `BeamGlyph` (compact) → the verdict word (inline), all from one pure tilt function (`balanceTilt`, ±3–10°, 0° for sparse/unreadable). This is the pattern the whole system generalizes: **every metric gets a full / compact / word-only renderer, and a view uses one fidelity per metric** (S4-D4).
7. **The assay-office brass language** — the beam/pans/dial/weights drawing, its scoped `[data-balance-visual]` tokens, the 650 ms single-value tween, and the segmented-rim `BalanceWeight` discs. The brass scale is the site's signature asset and stays as the balance's canonical instrument (§6.2) — with its scope narrowed so it stops competing with itself (F-01/DUP-2).
8. **Progressive-disclosure taxonomy** — the details side-panel/bottom-sheet (`useIndicatorDetailsPanel`, `role="dialog"`, focus trap, Escape, focus return), session-collapsed sections, native `<details>` for method blocks. The redesigned indicator pattern (§8) is this existing panel pattern, re-scoped to the 09 tier structure.
9. **Fail-closed honesty states** — why-unread cause lines, waiting lines, staleness words, the blocked-quartet disclosure. The visual system's job is to give these states *first-class visual form* (§5.5), not to invent new ones.
10. **The i18n/RTL mechanics** — the locale store, `dir` switching, logical properties everywhere, locale-aware `formatNumber` (Persian digits), Jalali dates via `Intl`, `bdi` islands for signed numbers, the forced-LTR analytical axes. Charts remain legible in fa RTL because the shipped rules already solve it; §9 makes them explicit requirements for new visuals.

### 2.2 Consolidate (drift found by the inspection — recorded, fixed at S5/S6, not this session)

1. **One card language.** Two card languages coexist: legacy `ui.tsx` Card (25px radius, `bg-white`, big soft shadow) and the insights card (`radius-md/lg` + `ring-1` + `0 2px 10px` shadow). **The gold page adopts the insights card only** (S4-D2): `rounded-[var(--radius-md)] bg-[var(--color-surface)] ring-1 ring-[var(--color-border)] shadow-[var(--shadow-card)] p-3` (compact) / `p-4…6` (briefing). The legacy Card retires from `/gold` surfaces as sessions rebuild them; other routes keep it untouched.
2. **Two shadow tokens** (the audit found no shadow scale; the card shadow is inlined ~8×): add `--shadow-card: 0 2px 10px rgba(15,23,42,0.05)` and `--shadow-focal: 0 10px 34px rgba(168,126,28,0.15)` (the gold-field focal shadow, currently hand-tuned twice). No new hues; the values are the shipped ones promoted to tokens.
3. **`--color-accent-gold-strong` is referenced but undefined** — `GoldPriceChart` silently falls back to `#b8860b`. Define it (`#b8860b` light / `#d9a43e` dark, the values the chart already renders) or fold into `--color-accent-gold-deep`; recorded as S4-D2's cleanup list, one-line CSS at S5.
4. **Hardcoded chart hexes** — the shared `Sparkline` uses `#22c55e/#ef4444` outside the token system (violating the "no new hex" discipline the world map enforces). S5/S6 retarget them to the status tokens.
5. **Two instrument metaphors** (brass assay balance vs LED shopfront boards) — they live on different routes and are both owned; the **gold page speaks brass/assay-office**, the LED boards stay on the rates surfaces. Not a conflict to resolve; a boundary to record (S4-D3).
6. **The S1-input discrepancy, flagged (not a conflict with S3):** S1's F-08 describes the hero as carrying "four lane rows with mini-rings"; the current `GoldHero.tsx`/`GoldBalanceClassic.tsx` carry no such rows (the actual per-lane visuals are the `.bal-lanes-bar` strip, the segmented-rim weights, and the Time Machine's lane chips). The F-08 *finding* (too many competing hero signals) stands on its DOM evidence; the "mini-rings" phrasing is retired in this session's descriptions. Recorded as S4-D12.

---

## 3. Art direction — professional market intelligence, three densities

**The register (owner decision 22, master plan §6.1):** credible, precise, modern, editorial, composed. Not a toy, not a trading terminal, not a stack of pale cards. The reference point is the front page of a serious research briefing crossed with a modern analytical dashboard: **typography carries the verdicts; instruments carry the composition; marks carry the metrics; everything else is paper.**

### 3.1 The three density tiers (master plan task 11)

The page's variable density becomes an explicit rule, not a per-card mood:

| Tier | Where | Density rules | Typography ceiling |
|---|---|---|---|
| **Briefing (spacious)** | The hero (Gold today + the briefing card + the conditions composition) and the five-force overview | Generous whitespace (`p-5`/`p-6`, `gap-4`+); one instrument per view; at most one `type-verdict` element; nothing smaller than `.type-label` in the primary reading path | `type-verdict` allowed; the dominant element is unique per screen |
| **Secondary (compact)** | Sections 4–6 (activity & demand, expectations, comparisons) | The insights card at `p-3`; two visual marks per card maximum; state word + band is the whole card | `type-number` allowed; no `type-verdict` |
| **Advanced (dense)** | Sections 7–12 (technical, relationships, history, calculator, Iran, publication notes) | Tables and disclosures allowed; `type-caption` meta rows; grouped controls; the highest label-to-ink ratio | `type-label` ceiling; numbers still `type-number` where they are the point |

**The dominance rule (acceptance criterion, one hero):** exactly one element per viewport-tier wears the focal recipe (the gold-gradient field + `ring-2 ring-[var(--color-accent-gold)]/40` + `--shadow-focal`) — in the redesigned page that is the **briefing block** (outlook-first, master plan §2.1 hero priority). The price block inside the hero is prominent but *not* focal (it keeps the spot-price number at `type-number` scale with its change; it does not wear the gold field). The conditions composition (balance + lanes) sits beside/below the briefing as the evidence layer, brass-instrument scale, no gold field. No other section may use the focal recipe (today `VerdictStrip` also wears it — that retires at S5 per DUP-2).

### 3.2 Composition principles

1. **One instrument per view.** The brass balance renders once per page-load (the hero conditions block). Every other surface that needs the net lean uses `BeamGlyph` or the verdict word (the fidelity ladder, S4-D4). This is the structural fix for DUP-2/F-01.
2. **Lanes explain, never re-verdict.** The five lanes may never render a verdict word of their own at briefing strength; they render composition (state word + tally + the lane bar, §6.3). A lane *summary sentence* is allowed (the 08 §5.1 one-liners); a lane *verdict headline* is not.
3. **Numbers where the number is the point.** The spot price, the CFTC percentages, the probability rows: the value is the answer, rendered at `type-number` with unit. Everywhere else the mark leads and the value rides as a secondary label (master plan §6.4).
4. **Anchored, not repeated.** One canonical presentation per concept (DUP-2/3/4/5/6's lesson); other surfaces reference by anchor or reuse the same record's renderer. The mapping doc (§12) assigns the canonical surface per row.
5. **Motion clarifies state only.** The existing rule: the beam's single 650 ms tween on data change; rate flashes on the live boards; all guarded by `prefers-reduced-motion`. New visuals add no ambient motion. Hover/press affordances at 140–200 ms, also guarded.
6. **Print.** The existing print block (light palette forced, chrome hidden, `break-inside: avoid` on cards) extends to the new marks: every band/bar/strip must print legibly on white (the token values already do).

---

## 4. The status and color semantics (owner decision 24 / §3.6 — the semantic map)

This is the page's most safety-critical visual contract. Colors encode **relationship to gold through the engine's polarity**, never the indicator's own virtue, never generic sentiment.

### 4.1 The five gold-impact states (the only state vocabulary a metric may wear)

| State | Meaning (locked) | Hue treatment | Always-paired carriers | Both themes |
|---|---|---|---|---|
| **Supports** | The current reading, read through the engine's polarity, supports gold | `--color-status-normal` #24a148 (both themes) | The state word (EN "supports gold" / FA «از طلا حمایت می‌کند») + a filled ▲-class glyph | Text via `--color-chip-ink-normal` #0E6027/#24a148 (≥ 4.5:1); fills at 9–16% tint for cards |
| **Pressures** | The reading pressures gold | `--color-status-alert` #da1e28 (light) / #fa4d56 (dark) | The state word («بر طلا فشار می‌آورد») + a filled ▼-class glyph | Text via `--color-chip-ink-attention` #B91C1C/#fa4d56; same tint discipline |
| **Steady / mixed-neutral** | Neither direction clear; the model's `steady` (lean 0) or lane `neutral`/`split` | **No hue**: stone/secondary (`--color-text-secondary` on `--bal-stone`/surface tints) for steady; the lane **split** case keeps the shipped amber `--color-status-watch` word treatment with the contest counts | The state word («بی‌طرف» / «مختلط») + the stone fill; split = amber word + both counts | Distinct from BOTH supports/pressures and unread by saturation (zero) and wording |
| **Unread** (data-quality) | The seat cannot be read: absent, stale, pending, or rule-driven (D-18) | Tertiary ink + **dotted** rim/stroke (`stroke-dasharray` on marks, dotted border on chips) — the physical metaphor: an outline waiting for ink | The why-line cause (upstream-stopped / upstream-gap / pipeline-lag / rule-driven) — never a guess | NEVER rendered as steady/neutral; the dotted carrier is the differentiator |
| **Blocked** (licence/source) | The quartet that cannot ship (WGC L3 ×2, PBoC 404, no venue) | Recessed well (`--bal-recess`-family surface) + the muted lock glyph; no data-shaped mark of any kind | The reason word (licence / source dead / no clean venue) + the owner-lever line, in the publication-notes disclosure | The honesty rule: never a fake neutral, never a zero, never an empty chart dressed as data (master plan §3.7) |

**The polarity rule stated once, enforced everywhere:** green/red attach to the *impact*, which the engine computes from the reading through each voter's polarity (08 §2.2). A rising value can therefore render green on one metric (e.g. `vix` rising → supports) and red on its neighbor (`us10y` rising → pressures). The card's evidence word (rising/falling/high/low) — set in the neutral return vocabulary with sign/triangle — is what carries the *indicator's own direction*, so the two channels are never confused: **direction (signed, own-value) and impact (state, gold-relative) are different marks with different hues and different words** (§4.3).

### 4.2 Where the ladder states live (the four-step scale is not the gold page's metric vocabulary)

The shipped four-step verdict scale (`normal/watch/stressed/alert`, `.verdict-meter`) belongs to the insights corridor's *condition meters* and stays there untouched. The gold page's metrics speak only the five states above. The one sanctioned overlap: the **conditions banner** family (e.g. the C12 gold-high-yields-high warning) keeps the `--color-status-watch/stressed` banner tints — it is an editorial warning, not a metric state, and it always carries its sentence.

### 4.3 The two-channel rule (direction vs impact)

| Channel | Question answered | Marks | Hues |
|---|---|---|---|
| **Direction** | "Did the indicator's own value rise or fall, and by how much, over a named window?" | Signed number (U+2212 minus / +) + triangle glyph, in a `bdi` LTR island | `--color-return-up/down` (loud kelly/red) |
| **Impact** | "What does that reading mean *for gold*, through the engine's polarity?" | State word + filled glyph + band/bar fill direction is irrelevant | `--color-status-normal/alert` (calm Carbon hues) |

A card may show both (e.g. the CFTC net card: "+8% of OI" in return ink beside "pressures gold" in alert ink). It may never show one channel wearing the other's hues.

### 4.4 Red/green accessibility and the never-alone rule

1. **Color is never the sole carrier** (WCAG 1.4.1; the shipped invariant): every hue pairing ships with (a) a word, (b) a glyph (filled ▲/▼ for impact; sign+triangle for direction; dotted outline for unread), or (c) a pattern (dotted = unread; dashing = class C in the explorer).
2. **Contrast floors:** state words render in the chip-ink siblings (≥ 4.5:1 on their tinted fills, both themes — the shipped values already comply); marks on charts use 3:1+ strokes against both `--color-surface` and `#1A222E`.
3. **Color-vision safety:** the supports/pressures pair is distinguishable without red/green discrimination by lightness separation (the Carbon green is markedly lighter than the alert red), by the glyph pair (▲ vs ▼), and by the word. The unread dotted treatment and the stone neutral rely on neither hue. Validation passes (Session 8's checklist): a deuteranopia simulation of the hero, the five-lane strip, one card of each state, and the CFTC bars.
4. **Dark mode is a first-class render**, not an inversion: the status hues keep their light-theme values except `alert → #fa4d56` (Red 50 — Red 60 fails on dark, the shipped fix); the brass tokens have a tuned dark set; every new mark in §12 specifies both-theme values from the existing tokens only (**no new hex values anywhere** — the world map's rule, extended to this program).

---

## 5. The one-system grammar — the balance and its five lanes (task 4, the DUP-2 fix)

The master plan's locked decision (§2.1 "Five visual lanes + balance"): *one coherent visual system in which the five lanes explain the composition of the overall balance, rather than two competing summary graphics.* The shipped page renders the verdict six ways (F-01) and the lanes compete with the instrument. The system below makes them one explanatory unit.

### 5.1 The Composition Stack (the pattern)

The conditions presentation becomes a single vertical stack, top-down:

```
┌─────────────────────────────────────────────────────────┐
│  ① CONDITIONS header + state word (type-verdict, once)  │  ← the verdict, said ONCE
│     «شرایط» + "Leaning against gold"                     │
│                                                         │
│  ② THE INSTRUMENT — the brass scale (hero tier)         │  ← the composition, physical
│     or BeamGlyph (compact tier) — ONE per view          │
│                                                         │
│  ③ THE FIVE LANE BARS — one LaneBar per lane:           │  ← the composition, flat
│     label · state word · the pill · tally               │
│     [▮▮▮▮▯▯▯▯] for-side · against · steady/unread dots  │
│                                                         │
│  ④ THE LEDGER affordance — "inspect the 37 voters"      │  ← the drill-in
│     (expands the lanes; opens weights' rows)            │
│                                                         │
│  ⑤ THE HONESTY LINE — measured note · not-a-forecast    │  ← the truth footer
│     caveat · freshness                                  │
└─────────────────────────────────────────────────────────┘
```

Rules that make it ONE system:

- **① says the verdict; ②–③ only show *why*.** The lanes never repeat the verdict word; their state words are lane-scoped ("relief", "strong", "elevated" — the engine vocabulary, 08 §5.1 design note) with the audience sentence beside.
- **② and ③ are redundant encodings by design, at different fidelities** — the beam's tilt is the *sum*; the five bars are the *addends*. The bars sit immediately under the instrument, visually connected (same width, aligned to the pans' tray), so the eye reads "the tilt is made of these".
- **④ is the only interactive layer** — tapping a lane bar or a weight opens the ledger row (the shipped pattern), which lists the lane's members with their seat states. No second balance renders anywhere else on the page (the Signals duplicate retires at S5; its lane ledger survives as the canonical drill-in if the owner keeps that surface — Q3-adjacent, flagged in §10).
- **⑤ is non-negotiable**: the balance is a *conditions* instrument. "This describes current conditions, not a forecast" (both locales, the shipped caveat) rides with every fidelity of the instrument — full stage, glyph, and word — because a tilted beam is exactly the kind of image that reads as a prediction if unlabeled (master plan §3.7).

### 5.2 The fidelity ladder (one metric, three renderers — generalized)

| Fidelity | Form | Used by | Rule |
|---|---|---|---|
| **Full** | The brass `BalanceStage` with pans, weights, dial | The hero conditions block (briefing tier) | Once per page |
| **Compact** | `BeamGlyph` (120×46 monochrome beam, same tilt math) | Inline contexts that reference the net lean (narrative lines, section intros, the time machine) | Unlimited, decorative+aria |
| **Word** | The verdict word + counts sentence | Text-only contexts (copy, tooltips, alt text) | Unlimited |

The same ladder now applies to *every* mapped metric (§12): each primitive has a full (card), compact (inline mark), and word (aria/copy) form. The `visualReading` fields authored in 09 are the word-fidelity texts of record.

### 5.3 The LaneBar (the one lane-summary renderer)

One component renders every lane summary, everywhere a lane appears (the hero stack, the five-force overview, the time machine's chips, the narrative's family lines, the on-ramp closes):

```
 Interest rates & borrowing costs        relief
 [████████░░░░░░░░░░░░]  2 for · 1 against · 4 steady
 نرخ بهره و هزینهٔ استقراض              آرامش
```

- **The pill** (the shipped `.bal-lanes-bar` pill, upgraded from 44×6 to a full-width 8px strip): stacked segments — supports (`status-normal`), pressures (`status-alert`), steady (stone), unread (dotted) — proportional to the lane's seat counts. In RTL the pill mirrors (logical order: reading direction); the segments' *stacking order* follows the reading direction so "for" always starts at the reading origin.
- **The state word** uses the engine vocabulary (relief/tight · strong/stress · elevated/calm · hot/cool · elevated/calm) in the lane's impact ink; the **audience label** (08 §5.1) rides as the row's label; the one-line intro renders under the group header in the overview, not on every bar.
- **The tally** in words (`2 for · 1 against · 4 steady`) — the numbers the engine exposes, no new scores.
- **Split lanes** (firing both ways, the amber case) render the pill with both hued segments and the amber word "split (2·3)"; **unread lanes** (0 readable) render the whole pill dotted with the why-line — never as all-steady.
- A11y: the pill is `aria-hidden`; the row's accessible name is "«lane label»: «state word». «tally»." — the words carry the meaning.

### 5.4 What dies, what survives (the dedup ledger for the balance family)

| Surface today (S1 §4) | Fate under this system | Session |
|---|---|---|
| Hero `GoldBalanceClassic` brass scale | **Survives** — becomes ② in the stack, the page's only full instrument | S5 |
| Hero verdict word + outlook line | Verdict word survives as ①; the 7-state "Conditions outlook" line's fate is **Q1** (§10) | S5 (owner gate) |
| Signals' second full `BalanceScale` | **Retires as a balance**; the section's lane ledger (if the surface survives) reuses ③–④ via anchors | S5/S6 (Q3-adjacent) |
| Narrative's five family lines | Survive as LaneBar compact renderers (one fidelity down) | S5 |
| Collapsed-signals lean line | Survives as word-fidelity + `BeamGlyph` | S5 |
| On-ramp driver closes | Survive as LaneBar compact renderers | S5/S7 |
| `.bal-lanes-bar` strip | **Becomes** the LaneBar pill (upgraded) | S5 |

---

## 6. The metric anatomy — position, history, range, unit, period, freshness, uncertainty (task 6)

Every indicator visualization must answer, in this order: *where is it now, where has it been, what is that relative to, in what unit, over what reference, how fresh, and how sure are we?* The anatomy is a fixed slot map so the visitor learns it once:

```
┌ Label (plain, 08 record) ─────────────── state word ┐
│ [ THE MARK — one primitive from §12's vocabulary ] │
│ value + unit · evidence word · window named        │
│ as-of/freshness · (technical: source · ref period) │
└────────────────────────────────────────────────────┘
```

### 6.1 The position-in-history family (the 10-year range band)

The engine's percentile basis is the rolling 10-year window (08 §3.2 `referencePeriod`; exceptions named per record, e.g. `m2-us` reads its YoY percentile basis). The canonical mark for a level/index/ratio reading is the **RangeBand**:

```
 3,599 USD/oz        near the top of its decade
 ├────────────▓▓▓▓▓▓▓▓░█──────────────┤
 1,700             10y range        4,300
            (▓ = 20th–80th pct zone · █ = today)
```

- **Geometry:** a horizontal track (the 10y min–max, labeled at both ends, `type-caption`), the inter-decile zone (20th–80th percentile) as a soft fill, and the current marker (a 16px dot + value label, the shipped `GoldPositions` marker style). A denser variant adds the 30-day-move trail (a thin line inside the band showing the move that fired the seat, when a 30-day rule exists).
- **Reading direction:** the band is a *magnitude axis*; it renders **LTR in both locales** under the house analytical-axis rule (the `.verdict-meter` precedent), with localized end-labels. (A range is not a time series; keeping all magnitude axes LTR means a visitor never has to re-learn which end is "more".) The band is `role="img"` with the word-fidelity sentence from 09's `visualReading` as its accessible name.
- **The band word** (the shipped `bandWord` vocabulary — "top/bottom X%", the middle word) rides as the secondary label so the position is stated in words too.
- **The reference-period disclosure (master plan §3.7's "hide the population" ban):** the technical tier prints the exact basis ("rolling 10-year window through 2026-11-19, 2,607 observations; YoY basis for M2"); the expanded tier simplifies to "its usual range of the past ten years" (08 §3.2's own wording rule); the default tier shows the word only. **Percentiles without their population are a defect** — the disclosure is mandatory at the technical tier, always.
- **Percentile ≠ good/bad:** the marker's hue is the *impact* state (through polarity), never the position. A real yield at the *top* of its decade renders an alert marker (pressures, polarity −1); a VIX at the top renders normal ink (supports, +1). The 09 records' `visualReading` lines already teach exactly this ("a marker near the top edge means high-for-the-decade, not 'bad'").

### 6.2 History and the named window

- **History appears in three honest sizes:** the *trail* (the 30-day move inside a band), the *sparkline* (a normalized polyline + end dot, `MIN_REL_RANGE` honesty padding kept), and the *chart* (the full house-grammar interactive: axes, ticks, inspector, pan/zoom on the price family). A card carries at most one; the details panel carries the chart.
- **Every window is named at point of use** (the C1 rule): "1d" / "7d" window tags, "52-week rolling", "12-month rolling", "since 2016-11", "same-length windows (30+)", "10-year reference". Never a naked number over a different span; never "10 years" over a 5.2-year series (the R01 lesson).
- **Time flows LTR in charts, both locales** (the house convention). Dated annotations (the CB tracker's episode rules, the correlation strip's 2022 marker) keep their alternating-height label pattern.

### 6.3 Unit, value, and the number discipline

- **Units always ride the value** (USD/oz · percentage points · tonnes · index points · ratio · barrels/ounce · percent of OI · percent of GDP), localized per the dictionaries; the troy-ounce disclosure (31.1034768 g) stays in the technical tier where the price family prints it.
- **`type-number` + tabular-nums + `bdi` islands for signed values** (the shipped bidi discipline — the fa "1d" percent-label fragility F-11 note is handled by keeping signs inside the LTR island).
- **Numbers are the point only where they are the point** (§3.1): the spot price, CFTC percents, probability percents, premium percents. Elsewhere the mark leads, the value annotates.

### 6.4 The freshness grammar (per-item, DUP-8's consolidation)

One micro-component, `AsOfChip`, renders every timestamp/freshness line on the page (today the hero alone carries three formats — F-08):

| Slot | Content | Render |
|---|---|---|
| Time | The as-of timestamp (locale calendar; HH:MM UTC; Jalali words for fa dates where prose) | `type-caption`, tertiary ink, trailing the block's title row |
| State | fresh (≤ staleAfterDays) · delayed (named lag: CFTC days, vault T+2.5wk, clearing month−2) · stale (the fromCache sentence) · waiting (the honest waiting line) | a suffix word; no icon rotation, no new colors |
| Cache | the shipped "(last successful)" qualifier | unchanged |

Rules: one AsOfChip per data block (never per sub-row except the bridge board's per-row as-of, which is its contract); the page-level "Data as of" line consolidates the projection stamp; freshness states never borrow market-signal colors (they are data-quality, §4.1's fourth state).

### 6.5 Uncertainty, honesty, and the banned imagery list

- **Model estimates are labeled at the mark** (term premium's "model estimate" tag; the decomposition's premium leg), not just in footnotes.
- **Coverage caveats ride the mark** ("proxy with lags" on the physical-flow cards; "insufficient history" waiting lines; the correlation strip's "a different sampling day moves the number").
- **Banned imagery (master plan §3.7, made concrete for this page):** no target-price crosshairs, no bull/bear mascots, no rocket/crash icons, no red/green candle backgrounds behind verdicts, no trend arrows on the balance or outlook (direction belongs to the evidence words), no confetti/celebration states, no probability dials for the outlook (§10), no implied-guarantee language in tooltips. Decorative art never outweighs evidence.

---

## 7. The indicator patterns — closed card, popover, bottom sheet, technical disclosure (task 7, wired to 09's tiers)

The owner's locked interaction pattern (§2.1 "Indicator interaction: Desktop popover; mobile bottom sheet") maps onto the 09 tier structure (08 §4) and the shipped details-panel infrastructure:

### 7.1 The three render states of every indicator record

| 09 tier | Surface | Composition |
|---|---|---|
| **Default** | The **closed card** (in a lane/group context) or the **seat chip** (compact list contexts) | plainLabel · defaultCopy (≤ 2 sentences, 09) · the mark (§12 primitive) · the state word · value+unit · AsOfChip. Nothing else. No hover requirement — the card is complete. |
| **Expanded** | **Desktop popover / mobile bottom sheet** (the same component, responsive) | + whyGold · whenRises/whenFalls (through polarity) · analogy where present (9 records) · the relationship one-liners (R-ids, tappable to the explorer/records) · the mark repeated larger with its trail/history |
| **Technical** | A **disclosure section inside the same popover/sheet** (`<details>`, collapsed) | + techName · raw value + unit · source + as-of · referencePeriod definition · firingRule/method · known limitations |

### 7.2 The popover/sheet contract (reusing the shipped panel)

- **Desktop ≥ lg:** the panel docks inline-end of the opener (the shipped `.insights-panel` right-sheet geometry, which already mirrors to the left in RTL), `min(440px, 92vw)`, scrim, focus trap, Escape, focus return, body scroll lock — all shipped behaviors kept.
- **Mobile < lg:** the same content docks as the bottom sheet (`max-height: 88dvh`, top radius-lg, drag-to-dismiss optional at S8). The shipped mobile sheet already exists on the insights corridor; the gold page adopts it.
- **Openers:** the whole card is the opener (the shipped stretched-transparent-button pattern `aria-haspopup="dialog"`); seat chips keep their *link* behavior (cross-page anchor navigation — F-12's contract) with the popover available from the destination card, not the chip. Keyboard: Enter/Space opens; the ledger rows remain focusable.
- **The Q3-adjacent note (silver):** silver is not an indicator record in the 68-row set (it enters via `gold-silver` 3.18 and the if-bought assets); its merged-card presentation is the owner's call (Q3/S1-D6). This session specifies only: whatever silver's home, it may not render a second balance-family instrument (the §5 rules bind any surface on the page).

### 7.3 The closed card, specified

```
┌──────────────────────────────────────────────┐
│ Real yields (inflation-adjusted)   supports  │  plainLabel · state word (impact ink)
│ ├─────────▓▓▓▓▓▓▓░█──────────────────┤ 1.9% │  the RangeBand + value+unit
│ High for its decade · fell 0.12pt this month │  band word · evidence word (return ink sign)
│ What bonds really earn after inflation       │  defaultCopy line 1 (09 record)
│ as of Nov 19 · FRED DFII10            ⓘ     │  AsOfChip · technical hint
└──────────────────────────────────────────────┘
```

- Grid: `grid-template: "label mark" / "meta meta"` on mobile (mark full-width under the label); two cards per row ≥ sm, three ≥ xl in secondary tiers; full-width in the briefing tier.
- Card height is *not* uniform across primitives (a composition card is taller than a band card) — rows align on the label baseline, `items-start`, never stretch-to-fill (stretching fake-normalizes different data types, the "generic gauge" trap's cousin).
- The unread card: the mark renders as the dotted empty band with the why-line where the evidence word sits; the state word is "unread" (tertiary); nothing else changes (same anatomy, honest contents).

---

## 8. Chart labels, legends, tooltips, accessible text alternatives (task 8)

Every chart and mark in the system obeys the **LABEL contract** (the house rules, stated as requirements for the new visuals):

1. **L — named series and windows.** Every line is named at point of use (color alone never identifies a series); every window is named (§6.2). Legends appear only when a mark's name cannot sit beside it (dual-axis pairs, the explorer's edge classes).
2. **A — axes labeled, ends anchored.** Y-axis min/max/mid values at `type-caption` on the inline-end; X-axis first/mid/last dates (localized calendar); the zero line on signed charts is a rule, labeled "0". Magnitude axes LTR (§6.1); time axes LTR (house rule).
3. **B — both themes.** No mark may use a value not in the token set; dark-mode checks are part of every pattern's spec in §12 (Session 8 runs the matrix).
4. **E — every mark has a text equivalent.** Each chart root is `role="img"` (or `group` where interactive) with an accessible name composed from the record's word-fidelity text: *what is compared, the current reading, the reference period, what to notice* — i.e., 09's `visualReading` sentence (it was authored for exactly this). Interactive charts add the keyboard inspector (arrows/Home/End/Escape, the shipped pattern) whose readout is the same sentence + point values.
5. **L — legends distinguish by shape+dash+word, not hue alone.** The explorer's M/C/X/K classes: **M solid** · **C dashed** · **X solid with a flag token** · **K solid heavier with an evidence tag** (§12.5). Dual-axis pairs: gold always `--color-accent-gold`, the comparison series always `--color-text-secondary` (the shipped correlation pairing, kept).

**Tooltips:** the shipped hover card (chart inspector) pattern — value + unit + full localized date; tooltips never carry the *only* statement of a caveat (caveats render on the surface; the tooltip may repeat them).

**fa RTL specifics:** chart roots `dir="ltr"`; HTML labels around charts flow in the reading direction; Persian digits everywhere `formatNumber` says; Persian typography guards (no letter-spacing/uppercase on fa — the shipped `.type-kicker` guard); mixed-direction strings (en tickers inside fa labels) ride `bdi`. The band/bar primitives mirror *stacking order* only (reading-origin alignment, §5.3), never glyph geometry.

---

## 9. Metaphor rules — the truth discipline (task 10)

The system's metaphors are **physical-instrument explanations of arithmetic, and nothing more**. The rules (master plan §3.7, operationalized):

1. **The balance is a composition metaphor, not a forecast metaphor.** Its parts map 1:1 to engine arithmetic: weights = firing voters, pan sides = for/against, tilt = net/(for+against), the tray = the honest non-firing seats, the dial = the tilt's bounded scale. Nothing in the drawing implies time or price direction. The not-a-forecast caveat (⑤ in the stack) is the standing guard.
2. **The band is a position metaphor** (where the reading sits in its own decade), never a speedometer of quality — the band has no red zone/green zone; the marker's hue is impact-through-polarity (§6.1).
3. **Analogy content follows S3-D9:** 9 records carry everyday analogies, each materially clarifying, each honest about limits (the mattress-vs-savings real-yield analogy; the fuel-gauge CFTC analogy; the blood-pressure STLFSI). Visuals never illustrate an analogy with mascot imagery — the analogy lives in words (the 09 records), the visual stays analytical.
4. **The banned list (§6.5) is part of this rule.** In particular: no visual may imply causation (edges in the explorer carry their evidence class, §12.5), no visual may compare unlike units on one axis (ratios and indexed lines only, master plan §6.2), no visual may turn missing into zero (the unread/blocked states exist precisely to prevent this).
5. **Weather-briefing is a structure, never a skin (master plan §3.1):** no sun/cloud icons, no temperature dials, no forecast-percent banners. The structure (condition → outlook → reasons → details) is the borrowed thing.

---

## 10. The outlook/briefing block — a distinct identity, owner-gated content (task 9a)

**What exists today (F-02):** no forward-looking outlook; the 7-state "Conditions outlook" is the balance re-worded (GB-S5's protected same-engine contract) with the honest caveat. **What this session designs:** the *visual container* for the master plan's §3.2.1 briefing format, and the presentation of the conditions-state word — with every content decision gated on Q1/Q2 (S1-D6; S3-D7). Nothing here authorizes a horizon publication; that requires the documented method the owner approves first.

### 10.1 The two identities, deliberately different

| | Current conditions (the balance family) | Forward-looking briefing (the outlook block) |
|---|---|---|
| **Visual identity** | The instrument: brass scale + lane bars — a *measuring device* | The editorial card: typographic, text-first, **no instrument, no gauge, no dial** |
| **Focal treatment** | Brass + composition; no gold field | The page's single focal recipe (§3.1) |
| **Voice** | "What supports / pressures gold now" (engine states) | Headline + summary + 2–3 reasons + what-could-change-this (08 §8.4's frame) |
| **Time stance** | The present reading | A horizon label **only where a method exists** (none does today — the block ships with the conditions-only framing until Q1/Q2 resolve) |
| **Guard** | "Not a forecast" caveat (⑤) | "Scenario, not a promise" framing; no probabilities, no targets, no confidence numbers (§8.4 locked) |

### 10.2 The briefing card (the container spec)

```
┌───────────────────────────────────────────────────────┐
│ BRIEFING · «مرور بازار»                     (kicker)  │
│                                                       │
│ Gold: conditions lean against it           (headline) │  ← type-verdict, one sentence
│ «طلا: شرایط علیه آن می‌چربد»                          │
│                                                       │
│ Three of five forces pressure gold today; the  (summary)│  ← one sentence + the
│ stress bid is the main offset.                         │    conditions-state word
│                                                       │
│ ▸ Real yields sit high in their decade      (reasons) │  ← 2–3 rows, each an
│ ▸ The dollar is strong-for-its-decade                  │    anchor-link to its
│ ▸ Stress is elevated but not extreme                   │    indicator record
│                                                       │
│ What could change this: a dovish Fed surprise  (caveat)│  ← one line, italic
│                                                       │
│ Evidence: broadly aligned · as of Nov 19     (footer)  │  ← consistency word (08 §8.2)
└───────────────────────────────────────────────────────┘
```

- The **conditions-state word** (08 §8.1's five drafts — "Conditions moderately pressure gold" / «شرایط در حد متوسط بر طلا فشار می‌آورد») renders as the summary's spine, in the impact ink of its side, **replacing the 7-state presentation only if Q1 approves**. Until then the shipped wording keeps its place inside this container (the container is layout; the wording is Q1's).
- **Reasons are anchored, not duplicated:** each reason row links to its indicator record's popover (§7) — the "why it matters now" is the record's `defaultCopy`, never a second card (master plan §3.4's canonical-presentation rule).
- **No horizon chip renders** until a validated method publishes one (§8.3's publish-only-what-a-method-supports). The container has the slot; the slot renders nothing today.
- **Scenario cards** (the §2.1 "qualitative direction + scenarios" form) are specified in the mapping doc §12.6 as the conditional extension: a three-path *narrative* row (upside/downside/sideways as labelled text cards with their trigger conditions) — text-first, no probability dials, no price paths. They activate only under Q2's approval.

### 10.3 The Q1–Q4 dependence flags (recorded, not decided here)

1. **Q1 — the "Bearish" line's fate:** the five-state vocabulary vs the shipped 7-state wording; the container holds either; the mapping doc's §12.6 states both renderings. Owner gate before S5.
2. **Q2 — outlook method/horizons:** nothing publishes until the method exists and is approved; the block's horizon slot and scenario extension wait on it.
3. **Q3 — silver's home:** binds any surface that would render silver analysis (§7.2's note).
4. **Q4 — budget:** §11 below.

---

## 11. The GoldPage chunk budget — the recorded decision item (task 11, Q4)

**The fact (S1 F-09):** the GoldPage lazy chunk is 238.9 kB raw / ~49.4 kB gz against the 240/50 ceiling — **~1.1 kB raw headroom**. Session 5's scope (hero rebuild + briefing card + composition stack + section nav + the popover/sheet re-scope) cannot fit in 1.1 kB. This session records the options; the owner's call is required before S5 implements (the assignment's explicit gate).

**The options (S4-D10):**

- **(a) Grow with justification** — raise the ceiling (e.g. 240 → 248/50.5) with the inline justification in `scripts/check-bundle-budget.mjs`, the repo's own precedent (the 218→240 GPE bump; the AsiaPage re-baseline). Cost: a recorded gate deviation, a slightly heavier first gold paint; the ceiling discipline survives (the budget script still enforces).
- **(b) Split the tail** — move the Zone O tail (Episodes + If-bought + Publication notes ≈ the heaviest non-briefing riders) to a second lazy chunk loaded on scroll/near-viewport, freeing raw budget for the briefing components. Cost: interaction complexity (the collapsed sections' one-tap open must still feel instant — a near-viewport prefetch covers it); the `GoldPage-*.js` basename freeze (R5) is preserved (it stays the entry of the gold route).
- **(c) Both, modestly** — a small ceiling growth (the briefing tier is the product's centerpiece; ~4–6 kB raw of primitives is the honest cost) **plus** the tail split to pay for most of it. **This session's recommendation** — it keeps the page's head honest, funds the system's shared primitives (the §12 vocabulary components), and sets the precedent that growth buys *system*, not sprawl.

**The estimate for the record (rough, to be measured at S5):** the shared primitives (RangeBand · LaneBar · AsOfChip · the popover shell re-scope) ≈ 3–5 kB raw; the briefing card + composition stack ≈ 2–3 kB; the section nav ≈ 1–2 kB; retirements (the second BalanceScale instance, VerdictStrip's focal duplication, legacy Card CSS on this route) recover ≈ 2–4 kB. Net before split: roughly +2 to +6 kB raw. The tail split can return ~15–20 kB. The numbers are planning aids, not commitments; S5 measures at every milestone (the program's standing discipline).

---

## 12. Mobile-first specifications (the pre-implementation requirement)

The acceptance criterion requires mobile variants specified *before* implementation. The system-level rules (per-pattern specs live in §12 of the mapping doc):

1. **The briefing fits one screen at 390 px.** The stack (headline → summary+state → price line → the compact composition: BeamGlyph + five LaneBars) renders within ~1.5 viewports; the brass full stage is available on tap ("inspect the instrument") rather than rendering by default below `lg` (its s-size already exists; the decision is *placement*, and the briefing tier keeps mobile lean). The five LaneBars stack full-width; the pill spans the row.
2. **The bottom sheet replaces the popover** below `lg` (§7.2); every card's opener target stays ≥ 44 px.
3. **Marks degrade by fidelity, not by shrinkage:** the RangeBand keeps its full geometry (it is already width-adaptive); charts keep the house grammar with fewer ticks; tables collapse to stacked rows per the shipped patterns (the CB buyers table's mobile form). Nothing renders below the `type-caption` floor (the 9.5–11px SVG text found in the audit retires with the rebuilt charts).
4. **The horizontal-scroll sanctity rule holds:** no new horizontal overflow at 390 px (S1 verified none today; the band/bar primitives are width-flexible by construction).
5. **Sticky elements:** the mobile section index (the master plan §4.4 anchor strip) docks under the global header, never covering focused controls; the sticky-nav spec is Session 2/5's placement work, but the visual system reserves a 44px strip slot in the tier map.
6. **Touch:** the ledger rows, popover openers, and chart inspectors keep the shipped touch/keyboard contracts; hover is never the only path (master plan §7.3).

---

## 13. Session 4 acceptance walk (master plan §10 Session 4 criteria)

- **Each data type has a justified visual form** — the mapping doc's vocabulary (`12-visualization-mapping.md` §1) assigns one primitive per data type (level → RangeBand · zero-anchored index → SignedDivergingBar · ratio → RangeBand + pair line · percent-change → RangeBand on the YoY basis · flow → FlowColumn · probability → ProbabilityRow · composition → StackedComposition · correlation → CorrelationStrip · price context → PriceMap/TimeSeries · episodes → EpisodeCard), with every one of the 68 rows mapped. ✅ (mapping doc §2–§4)
- **No generic gauge applied to every metric** — the gauge family is absent from the vocabulary by construction; the only instrument is the balance (the composition metaphor, §9.1). ✅
- **The balance readable without reading as a price prediction** — the Composition Stack (§5) + the mandatory caveat (⑤) + the no-trend-arrow rule (§6.5). ✅
- **Current conditions and forward-looking outlook have distinct visual identities** — instrument vs editorial card (§10.1). ✅
- **The five lanes and aggregate balance read as one explanatory system** — the Composition Stack's one-verdict/one-instrument/lane-bars-explain rules (§5.1) + the fidelity ladder (§5.2). ✅
- **Relationship diagrams distinguish mechanism from correlation, never implying unsupported causation** — the M/C/X/K shape+dash+word contract (the legend rule, §8 item 5; mapping doc §5). ✅
- **Colors encode relationship-to-gold, not generic sentiment** — the five-state semantic map + the two-channel rule (§4). ✅
- **Every chart understandable in fa RTL and en LTR** — the LABEL contract + the axis-direction decisions + the `bdi` discipline (§8). ✅
- **Mobile variants specified before implementation** — §12 of this document + the per-pattern mobile table (mapping doc §7). ✅

**Session 4 does not implement.** Every "renders/specifies" verb above describes the spec and the sketch sheet (`visual-references/`), not shipped code. The build plan and the owner gates (Q1–Q4) carry to Session 5.

---

*The metric-to-visual assignments for all 68 rows, the six difficult cases, the explorer and scenario prototypes, and the per-pattern mobile specs live in `12-visualization-mapping.md`. The sketches: `visual-references/`.*
