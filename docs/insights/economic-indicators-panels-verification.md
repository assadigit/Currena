# Economic Indicators — the panels round (2026-10-19 (panels)): verification notes

Owner round 3 on the hero's closing explanation panels, straight from the
live DOM: (1) the long word-choice rule panel («مبنای تعیین وضعیت هر
حوزه») should hide behind a low-key toggle; (2) the world-signals panel
(«سیگنال‌های جهانی») is "probably one of the most important parts of the
whole hero" and must carry more emphasis — larger type. Presentation-only:
no new copy (both panels reuse their existing keys), no data logic, feed,
count, ranking or aria-hook changes.

Local harness: `wrangler dev` (port 8787) serving the BUILT SPA with the
seeded local KV (including the live markets snapshot, signal `attention`,
so the Global signals panel renders exactly as production). The PWA
service worker was unregistered + caches cleared before the pass (the SW
serves the last precached build otherwise).

## What the round changed

| Directive | Change | Where |
|---|---|---|
| rule panel → low-key toggle | the always-visible tinted rule panel (Australia + Global's no-feed fallback) collapses to ONE quiet muted pill — `verdictRuleLabel` + a direction-neutral chevron, the "+n more" disclosure language, `aria-expanded`/`aria-controls` (GlossaryTip's mechanics). The click reveals the familiar tinted panel (hooks `data-ei-panel`/`-kind="rule"`/`-heading`/`-rule` + copy byte-identical to the fidelity round's); a second click collapses it again | `VerdictMeter.tsx` |
| signals panel → emphasized | heading + every bullet step from the 12.5px caption tier to **15px bold** (`leading-relaxed`), the state mark 16/18 → 18/20, bullet spacing 1.5 → 2, panel padding px-3/py-2.5 → px-3.5/py-3. The pale surface, region-step ink and the `data-attention-box`/bullets hooks stay exactly as approved — the panel is NEVER behind the toggle | `VerdictMeter.tsx` |
| bullet marker | the shared `BULLET_DOT`'s size is locked to the new 15px bullet type so the dot keeps its first-line seat | `VerdictMeter.tsx` |

No copy, no manifest round. Budget: Insights lazy chunk 657.00/157.50 →
**659.00/158.00** (measured 658.10/157.49; entry untouched 295.29/88.81) —
D-38 in `docs/DECISIONS_FOR_ALI.md`, CHANGELOG §2026-10-19 (panels).

## Measured results (agent-browser on the built SPA, EN + fa)

- **EN light desktop 1600**: exactly ONE `[data-ei-panel]` (Global,
  `kind=signals`) and ONE `[data-ei-rule-toggle]` (Australia,
  `aria-expanded="false"`, no panel in its DOM). Signals heading computed
  **15px/700**, bullets **15px/700**. AU pill width 232px, 24px from the
  card's inline-start (self-start — never a stretched bar).
- **Disclosure mechanics (real clicks, both locales)**: click →
  `aria-expanded="true"`, the rule panel appears with `id` matching the
  pill's `aria-controls`, `kind="rule"`, the full rule text present;
  chevron `rotate: 180deg` open / `none` closed (Tailwind v4 rotate
  property — direction-neutral, nothing mirrors in RTL). Second click →
  collapsed, panel removed from the DOM.
- **fa RTL desktop 1600**: toggle label «مبنای تعیین وضعیت هر حوزه»,
  pill 24px from the card's RIGHT edge (RTL inline-start); the expanded
  panel's 3px accent on the right edge; signals heading
  «سیگنال‌های جهانی» 15px; panel tint `oklab(... / 0.06)` (the step-3
  pale amber) with `border-inline-start-width: 3px`.
- **fa dark desktop 1600**: signals heading `rgb(218,30,40)` on the dark
  surface, panel tint `oklab(... / 0.05)` — token-alpha tints hold in
  dark mode.
- **fa mobile 390 (carousel)**: DOM order جهانی → استرالیا, Global on
  the first screen with the open signals panel, the rule toggle on the
  Australia screen; «بعدی» real click scrolls to Australia; the toggle
  expands the amber panel IN the card without clipping;
  `scrollWidth − clientWidth = 0` (zero horizontal overflow).
- **VLM acceptance** (en-collapsed / fa-expanded / fa-mobile pair): all
  four checks pass on every shot — the quiet pill reads as a toggle, the
  AU bottom is free of the rule paragraph, the signals panel reads
  prominent with type comparable to the row names, RTL edges/bullets
  correct, no clipping/misalignment/overflow anywhere.
- Zero console/page errors on every capture.

## Screenshots

`docs/insights/screenshots/economic-indicators-panels/`:
`en-desktop-1600-au-collapsed.png`, `en-desktop-1600-au-expanded.png`,
`fa-desktop-1600-au-expanded.png`, `fa-desktop-1600-au-collapsed.png`,
`fa-desktop-1600-dark.png`, `fa-mobile-390.png`,
`fa-mobile-390-au-expanded.png`.

## Gates

typecheck 6/6 packages · lint 0 errors (15 baseline advisories) ·
1,603 tests green (the three panel guards now exercise the disclosure
end-to-end) · copy:audit clean (no new strings) · build OK · budgets held
(entry 295.29/88.81 vs 296/89.5; Insights 658.10/157.49 vs 659/158.00).

## Production (currena.ir, after the 0230f09b deploy)

CI on main `557ff75`: completed/success (the full gate suite on GitHub's
runner). Live pass on a fresh profile (SW cleared): EN desktop 1600 — the
served chunks are exactly the `557ff75` build (`index-Uqbna-ql.js`,
`Insights-D2o0OWve.js`); ONE signals panel on Global at 15px/700 with the
production markets bullet ("World stock markets · Needs attention: 4 of
16 markets are 10% or more below their 52-week high."), ONE collapsed
toggle on Australia; the real toggle click expands the rule panel
(`aria-expanded="true"`, kind `rule`, real rule text). fa — toggle
«مبنای تعیین وضعیت هر حوزه» + signals «سیگنال‌های جهانی» correct. fa
mobile 390 — the carousel opens on جهانی with the open signals panel,
zero horizontal overflow. Zero page errors everywhere. Screenshot:
`fa-mobile-390-PROD.png` in the same folder.
