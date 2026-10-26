# QA — Round 42: the hero verdict cards calm down (2026-10-17)

Owner feedback on the Insights hero verdict cards (the Global / Australia
blocks): "This section has toooooo much color. It's everything and nothing
because being confusing." Seven specific asks, all shipped this round.

| # | Ask (owner) | Disposition | Where |
|---|-------------|-------------|-------|
| 1 | "Make the icons of Australia and world much smaller." | SHIPPED — region mark 48/64 → **24/28** (a compact header identifier; the big artwork stays in the dedicated sections mid-page). | `VerdictMeter.tsx` header |
| 2 | "Make the gauges of the situation a little smaller (proportionate with current state)." | SHIPPED — the state artwork beside the verdict word 44/60 → **32/40**, proportionate to the word. | `VerdictMeter.tsx` verdict row |
| 3 | "The meta of از 3 حوزه … can be grouped with the line behind it: A. items in stressed situation, B. items in stable situation — because those are relevant." | SHIPPED — the gauges now GROUP BY STATUS: one quiet box per step word («پرتنش» / «پایدار» …) with each area + its mini meter inside. The flat chip row, the computed reason sentence ("از ۳ حوزه، ۲ حوزه یعنی…") and the calm line are retired — they repeated each other; the grouping IS the sentence and can never contradict the gauges because it IS the gauges. `heroReason` stays in config, pinned by its tests. | `VerdictMeter.tsx` grouped module (`data-hero-gauges`) |
| 4 | "مبنای تعیین وضعیت هر حوزه can be hidden behind a tooltip." | SHIPPED — the long rule paragraph hides behind the shared "?" tip (`GlossaryTip`, tap/keyboard, never hover-only). New copy key `ui.verdictRuleLabel` (the pill's accessible name). | `VerdictMeter.tsx` verdict-rule tip |
| 5 | "The red notes can be grouped into a container with bullet points." | SHIPPED — the raised signals (world stock markets, currency patterns, section indicators) group into ONE bounded container (`data-attention-box`): the count line is its header, each signal is one disc bullet. With nothing to list, the count line rides bare (Australia's usual case). Red stays on the alert words only. | `VerdictMeter.tsx` attention module |
| 6 | "The tooltip in نتیجه چگونه محاسبه می‌شود can be hidden under a tooltip." | SHIPPED — the how-link hides behind the same "?" tip: the panel answers in one sentence (`ui.explainerIntro`) and keeps a jump to the full explainer (new copy key `ui.explainerFullLink`). | `VerdictMeter.tsx` how-tip |
| 7 | "I don't like the multi-colored grades. What if we use a more low-key color." + "This section has too much color." | SHIPPED — the four-segment meters drop the green/yellow/orange/red rainbow: a filled step is ONE neutral ink at every size (round 36's small-meter decree extended to the big meter). The attention tiles lose their pink tint for neutral surfaces. What keeps colour on purpose: the verdict word (the page's one status moment), the alert words inside the bounded container, and the region's own artwork — everything else goes grey. | `index.css` `.verdict-meter-seg`, tiles in `VerdictMeter.tsx` |

## Copy changes (fa fingerprint triage)

Removed (9, sources gone): `ui.heroReasonCalm`, `ui.heroReasonTop`,
`ui.heroReasonOthers`, `ui.heroReasonOthersOne`, `ui.heroReasonOthersMixed`,
`ui.heroReasonAndWord`, `ui.heroReasonIs`, `ui.heroReasonAre`,
`ui.heroCalmList`.

Added (2, triaged **processed** this round, reference = this file):
- `ui.verdictRuleLabel` — «مبنای تعیین وضعیت هر حوزه» — the pill's accessible
  name; the panel carries the existing `ui.verdictRule` text unchanged.
- `ui.explainerFullLink` — «توضیح کامل‌تر» — inside the how-tip panel, jumps
  to the About-this-data section.

Wording mirrors the owner's own phrasing (item 3: "This items are in stressed
situation / this items are in stable situation") — the group headers are the
app's existing four step words, so no new vocabulary enters the UI.

## Verification

- 1,326 tests green; typecheck 6/6; lint 0 errors; budgets held (no chunk
  growth — the change is component-internal + CSS).
- Browser-verified en/fa × light/dark × 375px: groups render both statuses,
  both tips expand/collapse (keyboard + tap), bullets RTL-align, meters are
  single-ink, no 375px overflow, zero console errors.
