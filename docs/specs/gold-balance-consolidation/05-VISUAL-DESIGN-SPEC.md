# 05. Visual design spec: the new Gold Balance

**Status:** SPECIFIED, NOT IMPLEMENTED, NOT YET RENDERED. Every number below
is a design target to be tuned in the browser during implementation (phase
P2). Nothing here has been verified visually. A draft HTML prototype exists
locally but was never rendered, so it is not part of this spec set.

**Owner brief (2026-10-31):** the balance looks primitive and basic. Wanted:
sophisticated, spacious, good looking, equally good on PC and mobile.

**Scope:** the look of `BalanceScale` and the card around it. The data model
(four lane chips, lane votes, context line) is in 01 to 04. Where 03 §1 says
"geometry untouched", this file supersedes it for visuals. Behaviour stays:
one animated value drives the beam, pans only translate, the beam formula is
unchanged (3 to 10 degrees, level at net 0).

## 1. What exists today (measured on https://currena.ir/insights, 2026-10-31)

| Observation | Value |
|---|---|
| Balance block size, desktop 1280 | about 1118 x 486 px |
| Beam | thin dark slate bar, green and red end dots, dotted baseline |
| Pans | pale rectangles with a dark floor line, small chips sitting at the bottom |
| Verdict | a small pale blue rounded box under the stage, 3 lines of small text |
| Neutral items | plain pills in a left aligned row below the box |
| Mobile 390 | pans about half width, chip text tight, the stage reads as a thin diagram |
| Tokens in use | gold `#f3b13f`, brand blue `#4a90e2`, text `#2c3e50`, success `#24a148`, alert `#da1e28`, radii 0.5 / 0.75 / 1.125 rem, Poppins, `.dark` class theme |

Problems to fix: the instrument is small and low contrast for the most
important thing on the card; the verdict is the weakest element although it
is the answer; neutral items look like an afterthought; large unused area
beside the stage on desktop; nothing signals "gold" except an icon elsewhere.

## 2. Intent

- **Who:** an Iranian reader checking gold conditions on a phone, often in
  Persian, usually for a few seconds. On desktop, the same person with time to
  look at the details.
- **Task:** answer "which way do today's conditions lean, and how sure is
  that" in one glance, then optionally see why.
- **Feel:** calm and precise, like an assay office scale. Warm, solid, not
  playful. Spacious: air around one instrument, not many boxes.

## 3. Design decisions

| Topic | Decision | Why |
|---|---|---|
| Focal point | The verdict word, large, directly under the instrument | It is the answer. Today it is the smallest text |
| Signature | A brass beam balance with **lane weights**: each lane is a round weight whose rim is split into one segment per driver, coloured by what it does | Only this product has lanes of drivers; the rim shows the evidence count without numbers. Replaces the wind meter's information in one object |
| Metaphor discipline | One metaphor: the balance. No wind, no score number | Owner decision D-GB-1 |
| Depth strategy | Soft layered shadows for the instrument and weights, hairlines for structure. Dark mode drops depth shadows and uses rings | One strategy, as the design system skill requires |
| Colour | One warm family (brass) for the instrument; green and red only for sides; stone grey for neutral. Colour never carries meaning alone: every state has words and a position | Gold is the topic, so brass is the natural material. Accessibility rule from 03 §5 |
| Density | Spacious: 24 px component rhythm, 40 to 56 px between major blocks on desktop, 20 to 32 on mobile | Owner asked for spacious |
| Rejected defaults | (1) a card grid of identical tiles, (2) a gauge or speedometer, (3) a plain progress bar | They would drop the balance metaphor or flatten the hierarchy |

## 4. Layout

### 4.1 Order, top to bottom (same on both viewports)

1. Eyebrow: "Gold, today's conditions" (11 px, weight 500, uppercase, tracked, brass-dark; no tracking in FA)
2. Title: the existing heading, 20 to 28 px fluid, weight 600, balanced wrap
3. One line subtitle (the new wording from 03 §6.1), 14 px, secondary ink, max 52 characters per line
4. **Stage:** the balance (4.2)
5. **Verdict block:** eyebrow "Today's lean", the verdict word at 30 to 44 px fluid (hero), a 4 segment lane strip, one counts line, the context pill
6. **"Not leaning" tray:** neutral and unread lane weights in a recessed well
7. **Ledger:** four expandable rows, one per lane (the detail panel, inline)
8. Footnote: not a forecast plus the backtest link

The card keeps one outer container (radius 28 px desktop, 24 px mobile),
inner padding `clamp(18px, 4vw, 44px)`, a very light warm radial glow at the
top. No nested cards: the stage, tray and ledger are separated by space and
surface tone, not by more bordered boxes.

### 4.2 The stage

| Property | Desktop (>= 720 px) | Mobile (< 560 px) |
|---|---|---|
| Beam length | min(500 px, 56% of stage) | 70% of stage |
| Beam thickness | about 20 px at the centre, tapering to 6 px at the ends | about 16 px, tapering to 5 px |
| Material | brass gradient (light top, dark bottom), thin dark edge, 1 px highlight line | same |
| Pivot | brass hub 24 px with a dark centre, a short needle over a dial arc with 11 ticks (centre tick longer), arc spans plus and minus 35 degrees | hub 20 px, ticks kept |
| Column and base | tapered brass column to a rounded foot with a soft contact shadow | smaller foot |
| Beam ends | white ring 14 px with a 3 px stroke: green on the "for" end, red on the "against" end | same |
| Pans | rounded trays, bottom radius larger than top (a shallow bowl), 300 px wide, 7 percent tint of side colour, hairline ring, a brass rim along the bottom | 47% of stage width |
| Hangers | two thin brass lines from each beam end to the pan corners, redrawn every frame | same |
| Pan caption | icon plus side label inside the top of the pan, in the side colour | same, may wrap to two lines |

"For" sits on the inline-start pan: left in LTR, right in RTL. The physical
beam sign flips in RTL exactly as `BalanceScale.tsx` does today.

Stage height is reserved from the worst case so nothing ever resizes: pivot
offset + hanger length + the tallest pan (four weights in two rows) + the
swing envelope `(beamLength / 2) x sin(10 degrees)` + base. No element is
clipped at any breakpoint.

Empty pan: the existing evidence based sentence, 12 px, tertiary ink, centred,
balanced wrap, inside the pan.

### 4.3 Lane weights (the pan items)

- A round brass weight, 58 px (desktop) / 52 px (mobile), with the lane icon
  engraved in dark brass. Neutral and unread weights use a stone face instead
  of brass.
- **Rim:** a ring of arc segments around the weight, one segment per driver
  in the lane (3 to 8). Segment colour: green supports, red pressures, hairline
  grey steady, dotted grey unread. Segments are sorted supports, then
  pressures, then steady, then unread, so a lane reads left to right as a bar.
  Stroke 4 px for firing drivers, 3 px otherwise.
- **Label** under the weight: lane name, 12 px, weight 500, max two lines.
- **Split badge** (neutral lane with equal supports and pressures): a small
  white pill on the weight's upper corner, text "Split" (03 §6.2).
- The weight is a button (44 px minimum hit area, including the label).
  Hover: lift 1 px and a slightly stronger shadow. Active: scale 0.97. Focus:
  2 px brass outline with 3 px offset. Press scrolls to and opens the lane's
  ledger row.
- Layout in a pan: weights wrap and centre with 10 px row gap and 14 px
  column gap. Maximum 4 per pan by construction.

### 4.4 Verdict block

| Element | Spec |
|---|---|
| Eyebrow | 11 px, weight 500, uppercase, tracked, tertiary ink |
| Verdict word | 30 to 44 px fluid, weight 600, letter spacing minus 0.02 em. Green for "leaning for", red for "leaning against", primary ink for "balanced" and "can't read". Always a word, so colour is never the only cue |
| Lane strip | four short bars (28 to 44 px wide, 6 px high), one per lane in fixed order, coloured for, against, neutral or empty. Decorative, `aria-hidden`; the counts line carries the text |
| Counts line | 13 px, secondary ink, tabular numbers: "1 for, 1 against, 2 not leaning" (adds "n unread" when needed) |
| Context pill | recessed pill: "Gold, last 30 days: -4.2%. Context only, not counted." 12.5 px. This is the footing line from 01 §6. It must never be green or red |

### 4.5 Tray: "Not leaning"

A recessed well (slightly darker than the card, inset hairline, very soft
inner shadow), max width 760 px, centred. Title left, one line note right
("Weighed, but no clear lean"). Weights inside at 46 px with 92 px wide
labels, centred, wrapping. Empty state: "Every driver is on a pan."
Unread lanes appear here with a dotted rim and the tray note unchanged.

### 4.6 Ledger (lane detail)

- Four rows, max width 760 px, centred, 64 px minimum row height.
- Row grid: weight (40 px) | name and state text | tally ("3 of 8 firing") | chevron.
- State text is in words: "Leans for gold", "Leans against gold", "Not leaning",
  "Split: 2 for, 2 against", "Couldn't be read".
- Open row: recessed surface, inline expansion (no modal). Members listed as
  dot, driver name, and "Supports / Pressures, evidence phrase" on the end side.
  Steady drivers collapse into one muted sentence. Unread drivers listed with
  a hollow dot. The inflation lane shows the tilt phrase; the 5y5y row shows
  the indicator card's own status word (rule B-12 in 02 §4.2).
- One row open at a time. Opening from a weight scrolls the row to the centre.
- Chevron rotates 180 degrees in 200 ms.

## 5. Tokens

Reuse every existing token (`--color-surface`, `--color-border`,
`--color-text-*`, `--color-status-normal`, `--color-status-alert`,
`--color-accent-gold`, `--radius-*`, `--type-*`). Add only these, scoped to
the balance, defined once in the web app's token file:

| New token | Light | Dark | Use |
|---|---|---|---|
| `--bal-brass-hi` | `#fbe3a0` | `#f3d488` | highlight stop |
| `--bal-brass-mid` | `#eab544` | `#d9a43e` | main brass (derived from `--color-accent-gold`) |
| `--bal-brass-lo` | `#b27a1d` | `#8f5f14` | shadow stop, rim |
| `--bal-brass-ink` | `#5b3d08` | `#2a1c04` | engraved icons on brass |
| `--bal-stone-hi` / `--bal-stone-lo` | `#eef2f6` / `#c7d0da` | `#46546a` / `#2b3646` | neutral weight face |
| `--bal-recess` | `#f3f5f8` | `#141b25` | tray and open row surface |
| `--bal-glow` | `rgba(243,177,63,.16)` | `rgba(243,177,63,.10)` | top glow of the card |

Side colours stay `--color-status-normal` (for) and `--color-status-alert`
(against). Contrast check required for the verdict word and the pan captions
on their tinted surfaces (WCAG AA, 4.5:1 for text under 24 px bold; the
dark-mode variants may need lightening).

## 6. Type scale (Poppins in EN, the site's Persian face in FA)

| Role | Size | Weight | Ink |
|---|---|---|---|
| Eyebrow | 11 | 500 | brass-dark / tertiary |
| Title | 20 to 28 fluid | 600 | primary |
| Subtitle, footnote | 14 / 12.5 | 400 | secondary / tertiary |
| Pan caption, weight label | 12 | 600 / 500 | side colour / primary |
| Verdict word | 30 to 44 fluid | 600 | by state |
| Counts, tallies | 13 / 12.5 | 400 | secondary, tabular numbers |
| Row name | 15 | 600 | primary |

All numbers `font-variant-numeric: tabular-nums`. Headings use balanced
wrapping, body and captions use pretty wrapping. Persian digits through the
existing locale formatter.

## 7. Motion

- One animated value drives everything (the existing rule): the beam rotates
  about the pivot, pans translate only, hangers are redrawn per frame.
- Duration 650 ms ease-out (quartic) on load and on data change, then still.
  Weights do not animate on their own.
- `prefers-reduced-motion`: jump to the final angle, no easing.
- Weight hover and press 100 to 160 ms, transform and opacity only.
- Chevron 200 ms. No other motion. No looping or idle animation.

## 8. States

| State | Look |
|---|---|
| Balanced, net 0 | Level beam, needle at centre tick, both pans light or empty, verdict "Balanced" in primary ink |
| Leaning | Beam tipped by the existing formula, heavy side lower, verdict in side colour |
| Fewer than 3 readable lanes | Level beam plus the existing not-enough sentence under the counts |
| All unread | Level beam, both pans show the "nothing weighed yet" sentence, needle hidden, verdict "Can't read the conditions", the tray holds four dotted weights |
| Loading | Skeleton: static level beam outline and four grey discs, no motion |
| Context missing | Context pill hidden |
| Split lane | In the tray with the badge and "Split: 2 for, 2 against" in the ledger |

## 9. Responsive rules

| Width | Behaviour |
|---|---|
| >= 1024 | Stage centred, max 640 px of drawing inside a wider card; tray and ledger 760 px; the empty margins are intentional air, not a second column |
| 720 to 1023 | Same, stage scales with the card |
| 560 to 719 | Beam 63% of stage, weights 54 px |
| < 560 | Beam 70%, weights 52 px, pan captions may wrap to two lines, ledger row tally moves under the state text, tray weights wrap to two per row |
| 360 | Must fit with no horizontal scroll; verify all four weights in one pan (two rows) |

Landscape phones and 200% text zoom must not clip the stage (the stage
height is derived from measured width and the worst case stack).

## 10. Dark mode, RTL, accessibility

- Dark: card surface `#19212c`, brass lowered in lightness, depth shadows
  replaced by `0 0 0 1px rgba(255,255,255,.08)` rings, glow weaker.
- RTL: logical properties only; "for" pan on the right; the badge sits at the
  weight's inline end; chevron stays at the inline end; the lane strip order
  mirrors with the document; no mirrored text or icons that carry direction
  other than the up and down arrows (which do not mirror).
- Accessibility: the drawing is one `role="img"` with the existing
  `gaugeAria` text; each weight button has `aria-label` "Lane: state. n of m
  drivers firing" (03 §5); ledger rows use `aria-expanded`; visible focus on
  every control; segments are decorative (the counts are in the label and the
  ledger); touch targets at least 44 px; no information by colour alone.

## 11. Implementation map

| File | Change |
|---|---|
| `apps/web/src/components/insights/signals/BalanceScale.tsx` | Replace the stage drawing: brass beam, hub, dial, column, tapered beam, new hangers. Add the weight component (rim segments, icon, split badge). Add the verdict block, tray and ledger layout. Keep: the single animated angle, pans translate only, `balanceCounts`, `driverStateOf`, the angle constants, RTL sign logic, reduced motion handling |
| New: `signals/balance-visual.css` or Tailwind token block | The `--bal-*` tokens above |
| New: `signals/BalanceWeight.tsx` | The weight (segmented rim). Pure props: lane key, member impacts, side, split, label, aria text |
| `signals/MergedCard.tsx` | Pass lane drivers with `members`, `split`, `tally` (03 §3); remove the old tray markup |
| i18n dictionaries | The strings in 03 §6 plus: eyebrow, verdict eyebrow, tray title and note, tray empty line (EN and FA, FA through the review round) |
| `scripts/check-bundle-budget.mjs` | Re-baseline after the redesign. SVG and CSS only: no new dependency, no image assets, no animation library |

No new dependencies. All artwork is inline SVG and CSS so it works in both
themes and scales without extra requests.

## 12. Acceptance criteria (visual)

| ID | Criterion |
|---|---|
| V-1 | The verdict word is the largest text in the balance and the first thing in the squint test |
| V-2 | The instrument (beam, pans, weights) fills at least 60% of the card width on desktop and at least 92% on mobile |
| V-3 | No horizontal scroll, clipping or overlap at 360, 390, 768, 1280, 1920 px, EN and FA, light and dark |
| V-4 | The weight rim shows one segment per driver and matches the ledger counts in every scenario (for, against, split, unread) |
| V-5 | The beam angle, needle and verdict match the unchanged formula for nets -3 to +3 |
| V-6 | No use of the words wind, tailwind or headwind, no score number in the balance |
| V-7 | Contrast: verdict word, captions, tallies meet WCAG AA in both themes |
| V-8 | Keyboard: tab to each weight and row, Enter or Space opens a row, focus is visible and returns correctly |
| V-9 | Reduced motion: no animation, same final layout |
| V-10 | Screenshots for six scenarios (balanced, leaning for, leaning against, split lane, all unread, loading), EN and FA, desktop and mobile, light and dark, attached to the P2 pull request |
| V-11 | The owner reviews the live preview (`?balance=lanes`) and approves the look before the default is flipped |

## 13. Open design questions

| ID | Question | Default |
|---|---|---|
| DQ-1 | Brass beam (warm, themed) or keep the current slate beam with only better proportions? | Brass. Revisit if it feels too skeuomorphic next to the rest of the site |
| DQ-2 | Segmented rim on weights: keep, or show the plain tally only? | Keep. It is the signature and carries the evidence count |
| DQ-3 | Ledger open by default on desktop? | Closed, to keep the page calm |
| DQ-4 | Lane icons: reuse the existing condition icons, or draw a new set? | Reuse first, new set only if they look inconsistent beside the brass |
