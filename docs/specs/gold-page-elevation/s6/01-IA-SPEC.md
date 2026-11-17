> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S6/01 — Information Architecture Spec: the Elevated /gold Section Map (M1)

**Session:** S6 of the Gold Page Elevation program (START OF PHASE B) ·
**Date:** 2026-11-17 · **Branch:** `docs/gold-page-elevation`

**What this is:** the information architecture of the elevated
`https://currena.ir/gold` — the full top-to-bottom section map, every
section's density tier (Core / Supporting / Advanced progressive
disclosure) and its collapse/mobile default, the placement of the three
decided features at the S2 audit's measured slots with the pros/cons
weighed, the wave-0 credibility-floor fixes folded in, and the
placements of every Core/Supporting feature from the finalised master
list (`s5/02`, F1–F27). S7's analytical framework and S8's roadmap build
on this map. Companion docs: `s6/02-COPY-PRINCIPLES.md` (the binding
copy rules) and `s6/03-MOBILE-AND-MODULE-MAP.md` (the 390 responsive
rules + the module map).

**CP-A status (per the S6 prompt's instruction):** the owner had not
answered the CP-A questions in the repo at this session's start (last
commit before S6: the S5 summary, `4feacf0b`). **This spec therefore
designs to the S5-recommended defaults** (S5-D4): the S5-D1 scope
(F1–F27 tiers) is treated as locked; the WGC letter is assumed
recommended-send (non-blocking, D7 proceeds either way); the two
build-time reads (Kalshi developer-agreement wording; the CBI gerami
pin) are assumed done by the first implementation session with the
triangulated band as fallback; the Treasury-direct switch is assumed
adopted into S8 (S4-D5). Each assumption is marked **[default]** where
it touches the map; CP-B can override any of them.

**Inputs (all cited, not re-litigated):** the S2 deep audit
(`docs/audits/2026-11-17-gold-page-deep-audit.md` — §1 the 13 verified
sections, §2 the issue log, §5a–§5c the measured slots, §6 the module
inventory), the head-to-head matrix
(`docs/audits/2026-11-17-gold-head-to-head-matrix.md` — §5 the
co-equal-Core rule + the do-not-copy list), `s5/02` (the finalised
tiers), `s5/03` §3 (the build-wave proposal), `s1/11` §7 / `s1/12` §3 /
`s1/13` §5–§6 (the three spec preps), S4-D1..D5, S5-D1..D5, S3-D1
(SA 41.5 vs C 39.5 raw — the explanation layer is co-equal Core).

---

## 0. The design principles that govern this map

1. **Verdict-first reading order.** The page's identity is the
   conditions meter. The reader's arc is: *state* (price, balance) →
   *why* (narrative + education) → *evidence* (signals + seats) →
   *local market* (the bridge) → *reference data* (levels, ratios) →
   *market structure* (flows, demand) → *trust* (licence wall + honest
   record). Nothing explains before the verdict exists; nothing
   forecloses the verdict with narrative.
2. **The explanation layer is co-equal Core** (S3-D1, the matrix §5
   verdict): the explanation band (F1/F5/F4) rides the top of the page
   beside the hero in the first build wave — not a second wave after
   the bridge/CB prizes. The prizes (F3 bridge, F2 CB-demand) are
   also first-wave.
3. **Trust-band contiguity** (S2 §5a): the licence wall and the honest
   record stay contiguous — no section inserts between them; new
   trust content (F23) renders *inside* the honest-record zone as a
   collapsed companion, never as a separate band between the two.
4. **Density tiers are the long-page management.** The elevated page
   adds ~8 sections to a page that already renders the balance three
   times (GPE-S2-21). The mechanism: Core sections expand everywhere;
   Supporting sections collapse to a one-line header + takeaway at
   390; Advanced sections collapse everywhere until invoked
   (progressive disclosure). The third balance rendering's duplicate
   expanders are removed (S6-D5, below) — the space donor the S2 audit
   named.
5. **The honest-identity invariants apply to every new section with
   no regression** (matrix §5c): as-of on every card, stale badges,
   fail-closed states, bilingual FA/EN with native RTL, Persian
   digits, Jalali dates, the Persian-copy manifest gate. SA's one good
   metadata habit (the COT report stamp, GPE-S3-24) is the *minimum*;
   the new sections keep the existing discipline.

---

## 1. The section map (top → bottom)

*Tier per `s5/02` definitions. "Wave" = the S5-D2 build-wave proposal
(S8 owns the final P1–P4 cut). "390 default" = the section's
mobile/collapse state at the 390px viewport. S2 §1 row = the lineage of
the existing page's 13 verified sections. FA names are drafts for the
copy process (Phase-D Persian-copy rounds), not final strings.*

| # | Zone (EN / FA draft) | S2 §1 row | Contents (existing + feature) | Tier | Desktop default | 390 default | Wave |
|---|---|---|---|---|---|---|---|
| 1 | App shell header + nav | 1 | unchanged; the "InsightsLEGACY" label decision (#25) is post-modularization, out of IA scope | shell | — | hamburger ≤768 (existing) | — |
| 2 | **A · Page head** (سربرگ صفحه) | 2 | breadcrumb, H1, tagline, data-as-of, absent-note — which gains a link to the sharpened wall (F13) and the FA-digit fix (#15 rider) | Core | always | always | wave 0/1 riders |
| 3 | **B · Price header** (قیمت لحظه‌ای) | 3 | price, 1-day change, 10y decile position, live-prices as-of line (+ #23 "last successful" qualifier, #27 spacing fix) + **market open/closed pill** (F16 scope note: adopt — names its reference market + timezone at point of use, the GPE-S3-10 lesson) | Core | always | always | wave 1 |
| 4 | **C · Balance hero** (برآیند عوامل) | 4 | beam, verdict, TODAY'S LEAN, counts, 30-day context, 5 lane chips (#17 affordance fix: aria-expanded + tooltip + destination state; #19 touch-target fix) + **the F15 outlook line under the resolved conditions grammar** (s6/02 §3) + the F12 time-machine control (Advanced, collapsed affordance, wave 4) | Core | always | always | wave 0/1 (F15); F12 wave 4 |
| 5 | **D · Explanation band** (توضیح امروز) — NEW | — | **F1 daily narrative** ("Why gold moved": the driver-family story, compact) + **F5 yield-decomposition card** (nominal = real + breakeven + term premium; Treasury-direct inputs **[default]** per S4-D5) + **F4 education on-ramp** (the five drivers, each closing at its lane — collapsed) + **F24 Fed-probabilities card + F25 calendar strip** (the expectations strip, compact) | Core (F1/F5/F4); F24/F25 Supporting riders | F1+F5 expanded; F4 collapsed; F24/F25 compact | F1 one paragraph; F5 stacked rows; F4 collapsed; F24/F25 one row | F1+F5 wave 1; F4 wave 2; F24/F25 wave 3 |
| 6 | **E · Signals section** (سیگنال‌ها) | 5 | gold+silver cards with range charts (wave 0: #01 window/label truth; wave 2: **F7 interactive chart** — pan/zoom/log + the D8 50/200 DMA overlays + unit-aware header), lane expanders, price footing, honest-record paragraph + backtest link (#24 skeleton fix); silver card unchanged — **F17 keep-small documented** in its footer (S5-D3) | Core | expanded (existing collapse toggle stays) | expanded, stacked | #01 wave 0; F7 wave 2 |
| 7 | **F · The Iran bridge** (پل ایران) — NEW, **slot A** | — | **F3 Bridge-1**: instrument board (the TGJU family, toman) + parity line per instrument + the documented حباب premium + expandable interpretation paragraph; Bridge-2 (premium history chart + deciles) extends later | Core | expanded (compact band) | stacked rows; premium = right-aligned secondary value | wave 1 |
| 8 | **G · The 37 seats, by lane** (عوامل مؤثر) | 6+13 | the lane cards (de-duplicated per S6-D5: the third balance rendering drops its byte-identical driver expanders, keeps lane header + verdict + seats) + **F16 why-unread lines** per dark seat (GPE-S2-06 decomposition: upstream-stopped / upstream-gap (CPI label) / pipeline-lag / rule-driven) + #18 anchored seat links (card-level `#hash`, name-matched) | Core | expanded | expanded, stacked | wave 0/1 |
| 9 | **H · PRICE LEVELS — TA band** (سطوح مرجع) — NEW, **slot B** | — | **F8 minimal TA**: SMA 20/50/100/200 reference rows + distance-from-200DMA decile + dated cross events (incl. whipsaws) + classic daily/weekly pivot table (سطوح پیوت) — TGJU vocabulary, classic-only guard (s6/02 §5) | Supporting | expanded | **collapsed** to header + the distance-decile sentence; tables behind one tap | wave 2 (gated on #01 fixed, S2 §5c) |
| 10 | **I · RATIOS** (نسبت‌ها) | 7 | the 8 existing cards + **F4's one-line plain meanings** (the #12 fix: each card gains its "what this ratio is" sentence) + **F10 multi-currency grid** (gold in EUR/JPY/GBP/CNY/AUD + local deciles + the KGX-style validation line) as a compact sub-card | Core-density (existing); F10 Supporting | expanded | expanded; F10 collapsed to a row | wave 2 (one-liners); F10 wave 3 |
| 11 | **J · FLOWS & POSITIONING** (جریان‌ها) | 8 | the 5 existing cards + **F14 COT percentile bands + crowd-gauge flags** (the managed-money vs non-commercial convention is a recorded copy rule → s6/02 §7; the S3-D3d item) | Core-density (existing); F14 Supporting | expanded | expanded; F14 compact | wave 3 (F14) |
| 12 | **K · CENTRAL-BANK DEMAND** (تقاضای بانک‌های مرکزی) — NEW, **slot A** | — | **F2 Tier-1** (IMF IL/IRFCL monthly tracker: rolling-12m global net purchases chart with the 2022 annotation, top-buyers table with the share-of-reserves column, revision caveat) + **F2 Tier-2** (the WGC GDT quarterly stack, first data-drop, attribution verbatim) + **F9 ETF flows card** + **F22 London vault + clearing cards** + **F11 correlation companion** (gold vs real yields / DXY, pre-registered windows, the Chain-1/Chain-4 crossover) — display-only, no meter membership (s1/12 §4) | Core (F2); F9/F22/F11 Supporting riders | F2 expanded; riders compact | F2 chart + top-5 buyers stacked (right-aligned tonnes); riders collapsed | F2 Tier-1 + first drop wave 1; F9/F22/F11 wave 3 |
| 13 | **L · Licence wall** (دیوار مجوز) | 9 | **F13 sharpened**: per-item why + the owner's actions + one link-out (#22) — the WGC CB line retires as Tier-2 lands (D7) and the wall's symmetry breaks by design ("a good problem", S2 §5b) | Core trust band | always | always | wave 1 |
| 14 | **M · The honest record** (سابقهٔ صادق) | 10 | the existing paragraph + backtest link + **F23 forecast-accuracy retrospective** (the LBMA analyst-survey vs actual, 2010–2026) as a *collapsed companion inside this zone* (trust-band contiguity preserved) | Core trust band; F23 Advanced | always; F23 collapsed | same | F23 wave 4 |
| 15 | **N · Gold Positions** (پوزیشن‌ها) | 11 | the 2 CFTC cards + #09 change-window label fix (wave 0) + #10 clamp fix (±100 bar semantics) | Core-density (existing) | expanded | expanded | wave 0 (#09) |
| 16 | **O · History & research tail** (تاریخ و پژوهش) — NEW | — | **F6 Episode Explorer** (1971→present annotated playbook, the WGC prices-workbook drop; the S3-matrix "asset comparison table" rides its series) + **F26 "if you'd bought" calculator** (gold vs S&P vs BTC vs silver, DCA since year Y) — both behind progressive disclosure | F6 Supporting; F26 Advanced | collapsed | collapsed | F6 wave 3; F26 wave 4 |
| 17 | App shell footer | 12 | unchanged (+ #26 anchor-fix rider) | shell | — | — | — |

**Every F1–F27 feature from `s5/02` is placed.** Core 9: F1→D ·
F2→K · F3→F · F4→D (+ the Zone-I one-liners) · F5→D · F7→E ·
F13→L · F15→C (the outlook line, resolved wording in s6/02 §3) ·
F16→distributed (B pill, C chips, G why-lines; the affordance fixes
ride their zones). Supporting 9: F6→O · F8→H · F9→K · F10→I ·
F11→K · F14→J · F22→K · F24→D · F25→D. Advanced 4: F12→C (collapsed
control) · F17→E (a footer note on the silver card, no new section) ·
F23→M (collapsed companion) · F26→O. Excluded 5 (F18, F19, F20, F21,
F27) are **deliberately not placed** — the exclusion list stays a
positioning asset (`s5/02` §1); nothing renders for them.

---

## 2. The three decided placements — recorded rationale against the measured slots

The S2 audit measured the slots; S6 confirms the placements and records
what was weighed. The audit's S2-D2 recommendations are hereby
**confirmed as placements** (S6-D2).

### 2a. The Iran bridge → Zone F, S2 §5a slot A (between the Signals section and the 37 seats, ~3,480px at 1440)

**Weighed:**

| Slot | Pros | Cons | Verdict |
|---|---|---|---|
| **A (chosen)** — after the conditions story completes | "global meter → local market" is exactly the owner's D6 answer A (global-first); the bridge reads as the page's *second chapter* — the natural rest point after the global verdict | pushes the seats (the meter's evidence) further down; adds length to an already long page | **CHOSEN** — the con is mitigated twice: the Zone-D explanation band sits above (the reader arrives at the bridge already oriented), and the #21 de-duplication (S6-D5) returns the space the seats lose |
| B — between the honest record and Gold Positions | end-of-analytical-spine grouping with "market data"; does not break the hero→seats→cards rhythm or the trust band | low visibility for the program's biggest differentiator (`s1/14` F3) — dead-last placement undersells a Core feature | rejected |
| C — page end | cheapest layout-wise | same, worse | rejected |

Additional S6 decisions riding slot A (the s1/11 §7/§9 open items,
resolved):

- **The ounce row does not join the board** — it stays implied in the
  parity line: the page's Zone B already carries XAUUSD, and the
  parity line renders the computed toman-per-ounce intermediate
  (s1/11 §9 item 3, resolved). The board shows the coin family +
  geram18/geram24 + mesghal (with its آبشده convention documented on
  the card, S4/03 §1b).
- **Compact band with an expandable interpretation paragraph** (the
  audit's own recommendation): board + parity + premium visible; the
  one-paragraph interpretation (descriptive, dated, Chain 2+8
  teaching) behind one tap — the daily reader gets the numbers, the
  curious reader gets the lesson.
- **As-of discipline on the Tehran rows** (matrix §4a's added
  requirement): the TGJU market-day stamp renders per row
  («۲۵ آبان»-style, Jalali in FA, converted Gregorian in EN) — the
  bridge as-ofs its rows the way SA as-ofs its COT (GPE-S3-24's one
  good habit; Currena's existing discipline already exceeds it).
- **Bridge-2/Bridge-3** (premium history chart + deciles; education
  deep-dive) extend Zone F in later waves without moving it
  (s1/11 §8).

### 2b. The CB-demand section → Zone K, S2 §5b slot A (directly after the FLOWS cards, before the licence wall, ~5,000px)

**Weighed:**

| Slot | Pros | Cons | Verdict |
|---|---|---|---|
| **A (chosen)** — flows → demand, before the wall | the natural narrative hand-off: positioning (speculative flow) → demand (structural ownership); the wall's "Central-bank gold demand" line sits right below and becomes the honest "now published (Tier 1: IMF)" footnote as Tier-2 lands; the physical-market cards (SGE/Swiss/Shanghai) stay adjacent in Zone J | the wall's four-item symmetry breaks as items unblock — a good problem (the audit's own words) | **CHOSEN** — the trust band (wall + record) stays contiguous *behind* Zone K; nothing inserts between wall and record |
| B — a lane-style section after the 37 seats | mirrors the meter's lane structure | the meter has no demand lane (2/37 voters); a section that *looks* like a lane but does not vote needs careful framing — the framing burden slot A does not carry; with the display-only decision below, a lane-mirror visual is actively misleading | rejected |

**Display-only first (confirmed, s1/12 §4):** no CB-purchases voter
joins the 37-seat meter in this IA — meter reweighting is a governance
event with backtest implications (the D-GF-1 lineage; a voter-table
change ships in its own gated session, exactly as the 20→21 promotion
did). The section teaches the Chain-4 story with data; the meter stays
at 37/5 until a separately-governed decision. The F11 correlation
companion renders *inside* Zone K as its closing card (s1/12 §3's own
sketch: the Chain-1/Chain-4 crossover visual belongs with the 2022
annotation it explains) rather than as a standalone band — one zone
per story, and the trust band's contiguity is untouched.

**Copy reconciliation recorded (S2 §5b's finding, for s6/02 §7):** the
`usd-reserve-share` seat (dollar lane, polarity −1) and the CB-demand
section tell mirror stories from the same IMF family — opposite sign
conventions on different objects. The copy must name both framings at
their points of use (the seat: "rising USD share of FX reserves = a
gold headwind"; the section: "central banks accumulating gold = the
de-dollarisation tailwind") and cross-link them.

### 2c. The TA table → Zone H, S2 §5c slot B (a "PRICE LEVELS" band immediately before the RATIOS block, ~4,700px); the DMA overlay rides F7

**Weighed:**

| Slot | Pros | Cons | Verdict |
|---|---|---|---|
| **B (chosen)** — before RATIOS | clean sibling to the RATIOS/FLOWS headers; the pivots table reads as *reference data* like the ratios; does not touch the meter's narrative (no lane, no verdict); the page already teaches window-relative thinking ("+107.5% 5 years") — the decile grammar is coherent beside range-based cards | "levels" separated from the chart they annotate | **CHOSEN** — the con is answered by the split the audit itself recommended: the *overlay* (50/200 DMA lines) rides the F7 interactive chart in Zone E (slot A's position, under the range chips), the *table + decile row + events list* render in Zone H. The two renderings cross-link (the decile sentence links to the chart anchor) |
| A — inside the Signals section under the gold chart's range chips | price context lives where the price lives | crowds the merged card; the silver card follows immediately | rejected for the table (kept for the overlay via F7) |

**Gated on wave 0 (binding, S2 §5c + matrix §4c):** the TA block ships
only after **#01 is fixed** — a TA block citing 10-year percentile
grammar beside a chart mislabeling its 10-year window would compound
the confusion. The wave-2 sequencing (S5-D2) enforces this; the IA
records it as a hard precondition, not a preference.

---

## 3. The wave-0 credibility floor, folded into the map

The fix-first three (GPE-S2-01/-02/-09) + the F16 why-lines (S5-D2's
wave 0) are folded into the zones above so the credibility floor and
the new sections land as **one coherent page** (S2-D1: sequenced
before/alongside the first new section — they sit in the credibility
lane the new sections borrow; matrix §5: measured against a competitor
whose numbers reproduce):

| Fix | Zone | The fix as spec'd | Citation |
|---|---|---|---|
| **#01** the "10 years" chip renders a 5.2-year window | E (Signals) | the flagship chart's label tells the truth before anything new ships: either the public-history window widens server-side (an S8 sizing decision against `PUBLIC_HISTORY_WINDOW_DAYS = 1900`, `apps/api/src/routes/insights.ts:152`) or the range honestly relabels to its true window + the readout sentence states the actual horizon; the stale code comment (`verdict.tsx:183`, "the history feed already carries the complete 10-year daily series") is fixed with it (#30, its code-level twin) | GPE-S2-01 (HIGH); V-06 |
| **#02** the FA SGE/Swiss cards say «میلیون تن» | I (RATIOS/FLOWS cards) | the `unitTonnes` dictionary pair renders «تن» (tonnes) in FA and "tonnes" in EN — the values are already correct; one string pair | GPE-S2-02 (HIGH) |
| **#09** the "−8.8 pts" unlabeled 30-day change | N (Gold Positions) | the change line gains its window word: "30-day change" / «تغییر ۳۰ روزه» (the actual w/w is −2.0 pts; the label ends the ambiguity) | GPE-S2-09 (MED) |
| **F16 why-lines** | G (Seats) | one status line per dark seat with its cause class from the S2 §3 decomposition: upstream-stopped (the UoM family, "source stopped publishing — Sep 2026"), upstream-gap (CPI, with the «مبنا: میانگین دو ماه مجاور» label once S4-D1 lands), pipeline-lag (CFTC/GPR: "data published upstream, next ingest will carry it" — honest until the two operational P0s are fixed), rule-driven (the US−Japan gap: "value mid-range; no decile history for this seat yet") | GPE-S2-06 (MED) + §3; S4-D1 |
| *Riders (same ship, LOW):* #15 the FA absent-count digit; #23 the live-prices "last successful" qualifier; #27 the cramped hero glyph run | A, B, B | trivial copy/UX riders that ride the same build | GPE-S2-15/-23/-27 |

The two operational P0s (the CFTC Saturday gate + the GPR re-fetch)
remain **outside GPE's build order** — owned by the
modularization-closeout window (S2-D4, carried cited through
S3/S4/S5; not re-litigated here). The why-lines render honestly for
as long as those persist.

---

## 4. Density-tier mechanics + the long-page management

**The rules (binding for Phase D):**

1. **Core sections** render expanded on desktop AND at 390 (stacked
   single-column, right-aligned secondary values — the measured-safe
   patterns, s6/03 §1).
2. **Supporting sections** render expanded on desktop, and at 390
   collapse to a one-line header + the zone's single takeaway
   sentence, one tap to expand. (Zone H: the distance-decile sentence
   stays visible; Zone K's riders: the top-line number stays visible;
   F10: one row.)
3. **Advanced sections** collapse everywhere until invoked: F12 = a
   control in the hero; F23 = a collapsed companion inside the honest
   record; F26 = a collapsed card in the tail. Progressive disclosure
   is the Advanced tier's *definition* (`s5/02`).
4. **The collapse state is per-section, persisted to `localStorage`**
   the way the Balance/Minimal radio already is (V-05) — the
   returning researcher's choices survive reloads and locale switches.
5. **The third balance rendering is de-duplicated (S6-D5):** the
   seats-section lane cards drop their driver expanders (byte-identical
   to the Signals section's, GPE-S2-21) and keep the lane header +
   verdict + seats list. The hero and the Signals renderings keep
   theirs. This is the space donor that funds the bridge band and the
   explanation band without lengthening the page net; it must be
   re-verified against the frozen snapshot pins in Phase D (a page
   change to an existing test-pinned surface).

**What this buys:** the S3 verdict's five explanation-class gaps are
closed inside a page whose *daily-reader* weight stays near today's:
at 390 the Supporting tier collapses, the Advanced tier hides, and
the reader's scroll is dominated by Core (price → verdict → why →
signals → bridge → seats → the levels sentence → ratios → flows →
demand → trust).

---

## 5. The reading-order rationale (why the explanation band sits where it sits)

The one placement this IA adds beyond the audit's measured slots is
the **Zone D explanation band** (F1 narrative + F5 yield card + F4
on-ramp) directly under the balance hero, before the Signals section.
Weighed:

- **For:** the matrix §5 verdict names SA's own page as "the working
  reference for their placement (top-of-page narrative band;
  inflation/rates block adjacency)" — the Persian reader's expected
  position for "why did it move" is directly under the price/verdict
  header; the narrative is *bound to the meter* (S4/01 §2's GRAM
  mapping: the driver families with firing states), so verdict →
  why → evidence is the natural syllogism; F5's yield equation is the
  flagship "assembled macro reading" the S3 verdict demands, and it
  belongs beside the narrative that cites it.
- **Against:** it pushes the Signals apparatus (the page's existing
  Core) down; it risks narrative-before-rigor if the binding fails.
- **Mitigations:** the band is compact (one narrative paragraph + one
  decomposition card; F4 collapsed); the binding caveat is a copy
  rule (s6/02 §7: "the meter explains conditions, not the price
  move" — no invented attribution arithmetic); and the hero stays the
  page's flag — nothing renders above the verdict except the price.

**The S7 dependency:** the Zone D band, the Zone F interpretation
paragraph, the Zone K 2022-annotation copy, and the anchor graph that
links them (the #18 pattern extended: driver families → seats → cards
→ episodes) are exactly S7's analytical-framework scope. S6 places the
containers; S7 designs their contents' causal language.

---

## 6. Method and limitations

The map is built from the S2 audit's verified section inventory (§1,
13 sections, all rendered 2026-11-17), the finalised master list
(`s5/02`, F1–F27), the measured slots (§5a–§5c, positions at 1440×900),
and the build-wave proposal (S5-D2). The modularized tree was
re-verified read-only this session (every `features/gold/` +
`domains/gold/` file named in the S2 §6 inventory exists at the
session's checkout). Limitations: (1) placements are IA decisions on
paper — no code exists or was touched (standing constraint; Phase D
implements under its own discipline); (2) the pixel positions quoted
are the S2 audit's 2026-11-17 measurements and will shift as sections
insert — the *order*, not the offset, is the durable content; (3) FA
zone names are drafts pending the Persian-copy manifest rounds; (4)
the map assumes the S5-recommended CP-A defaults (header note) — CP-B
can override, and the wave tags are S5-D2's proposal pending S8's
final P1–P4 cut.
