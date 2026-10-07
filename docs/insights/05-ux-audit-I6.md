# 05. Insights UI/UX audit — Phase I6 (2026-10-07)

Evidence-based audit of `#/insights` against `02-page-design-spec.md`, run
against the live production snapshot (replayed locally through the real
Worker + seeded KV, byte-identical to currena.ir at commit `2803932`;
production spot-checked directly too). Methods: agent-browser DOM + geometry
measurement (the ground truth for RTL/contrast — VLM screenshots used as
secondary hints only), programmatic WCAG contrast computation (blended over
real backgrounds incl. opacity + tint layers), VLM visual review, and manual
state simulation (API blocked / cache primed / cache cleared).

Scope reviewed: en + fa × desktop 1280 + 375px × light + dark; all 30 cards;
expanded panel + chart + SR table; jump nav; summary block; what-changed
(quiet-week live in this snapshot); coming-up (no "soon" event live — latent
state constructed and measured); stale cards (2 live); offline-cached banner;
error state; skeleton.

## What already passes (keep, don't touch)

- RTL mirroring by DOM geometry (jump nav first button hugs the right edge;
  chip sits left of the name; no horizontal overflow at 375px in either
  language; `scrollW == clientW` everywhere).
- Persian digits + Jalali dates in fa values, footers, calendar, banner.
- Chart time axis LTR in fa (svg wrapped `dir="ltr"`, min-year at low x) —
  documented decision, working.
- Bidi isolation (`<bdi>`, `dir="ltr"` runs for signed changes); no
  scrambling found.
- Heading order h1→h2→h3(group)→h4(card)→h5(panel sections); real buttons
  with `aria-expanded`/`aria-controls`; `role="meter"` with valuetext;
  SR data table (≤12 rows) behind `<details>`.
- Mobile single-open (opening one card closes the previous), desktop
  multi-open; language switch keeps scroll + open cards.
- States all render honestly: quiet-week copy, error + retry, cached
  banner with Jalali date, skeleton grid.
- Dark theme contrast is green across the board (6.1–16.2:1).
- Zero console/page errors in every combo.

## Ranked findings (severity × effort)

| # | Sev | Effort | Finding | Evidence |
|---|-----|--------|---------|----------|
| F1 | **P1 a11y** | Low | **Light-theme status-chip text fails WCAG AA on all 30 cards**: Normal (success) 2.78:1, Warning 2.78:1, Context (blue) 3.29:1 — 11.2px bold on tinted pills. Spec §9 requires the contrast check. | computed on live cards |
| F2 | **P1 a11y** | Low | **More light-theme AA failures in accents**: group h3 headers (blue on #F8FAFB) 3.14:1; panel CopySection h5s (blue, 11.5px) ≈3.3:1; source-link pill (blue on blue/10) ≈3.3:1. | computed |
| F3 | **P1 a11y (latent)** | Low | **What-changed rows**: moved-to-warning text 2.78:1, moved-to-normal 2.78:1 on their tints — invisible today (quiet week) but fires the moment any indicator changes state. | constructed + measured |
| F4 | **P1 a11y (latent)** | Low | **Coming-up "soon" rows**: coral date/`{n} days away` text **1.92:1** on white — fires within 7 days of an event (next: 2026-10-21 window). | constructed + measured |
| F5 | **P1 a11y** | Low-Med | **Stale-card blanket `opacity-60` kills text contrast**: one-liner 2.33:1 light / **1.96:1 dark** (2 stale cards live today). Grey-out must not make text unreadable (spec §6 "greyed" ≠ unreadable). | computed with opacity blending |
| F6 | **P2 UX/a11y** | Med | **JumpNav has no active-section awareness** — 5 identical pills, no indication of where you are while scrolling (brief asks for scrollspy); buttons only **30px tall** (<44px touch minimum). | DOM measurement |
| F7 | **P2 a11y** | Low | **Sub-44px tap targets**: chart-table `<summary>` 16px; "How this is calculated" link ~20px; disclaimer jump link similar. | geometry |
| F8 | **P2 buglet** | Trivial | **Chart year labels render thousands separators**: "2,016" en / "۲٬۰۱۶" fa — wrong for years, ugly in both locales. | DOM + fa screenshot |
| F9 | **P2 a11y** | Low | **Summary block landmark mislabelled**: `section[aria-label="Global"]` on the summary (duplicate of the real Global section in the landmark list); no heading of its own — heading nav starts at "What changed". | DOM |
| F10 | **P3 a11y** | Low-Med | **Expand button's accessible name is the whole collapsed card (~33 words)**; h4 heading names include value + chip words (noisy in SR heading/button lists). | DOM accessible-name dump |
| F11 | **P3 UX** | Low | **Expanded panel wall-of-text**: five 11.5px failing-contrast titles, gap-3, chart caption 11.2px — brief's own "five sections can read as a wall of text" concern confirmed by VLM. | DOM + VLM |
| F12 | **P3 UX** | Low | **Chart tick density**: only start/end year labels on a 10-year axis; no mid-axis orientation. | DOM |
| F13 | **P3 polish** | Low | VLM + review: disclaimer bar slightly heavy (border-s-4 + tint reads like a system alert); "How this is calculated" link floats unanchored under the summary grid. | VLM |
| F14 | **P3 fa polish** | Low | **Jalali date-time separator is a Latin comma**: "۱۴۰۵/۰۷/۱۵, ۱۵:۴۶:۲۵" (ICU artifact for fa-IR-u-ca-persian) — should be "،" in Persian typography. | Intl reproduction + banner |
| F15 | **P3 polish** | Trivial | Card footer meta at 0.68rem (10.9px) is very small; position bar 8px tall is thin; warning-zone tint 25% barely perceptible (non-text contrast). | review |
| F16 | Could | — | Chart hover/focus tooltip, print stylesheet — stretch items, backlogged. | — |

## Fix plan (Phase B — presentation layer only)

1. **I6-UX contrast**: add *deep* accent tokens to the theme (light values
   ≥4.5:1 on white/tints; dark overrides keep the current bright tokens),
   apply to chips, group h3s, CopySection h5s, source pill, WhatChanged rows,
   Coming-up soon text; rework the stale grey-out (no blanket opacity — grey
   via muted value color + desaturated accents, keep text ≥4.5:1); bump card
   footer to 0.7rem. Verify both themes ≥4.5:1 programmatically.
2. **I6-UX charts**: `useGrouping: false` year labels (+ test), one mid-axis
   year tick, 10px position bar, zone tint 30%.
3. **I6-UX nav + summary**: JumpNav scrollspy (`aria-current="true"` +
   active pill style), ≥44px pill targets, chart-table summary padding;
   summary section gets its own label + visually-hidden h2 (new copy keys,
   en source of truth + native fa); anchor the how-calculated link.
4. **I6-UX card a11y + panel readability**: button + h4 labelled by
   name(+ticker) via `aria-labelledby`; panel section titles restyled
   (bigger, deep-blue, more gap); chart caption bump.
5. **I6-UX fa polish**: Persian comma for Jalali date-time runs in core
   `formatJalaliDate` (fa only) + unit test.

Every change: typecheck 5/5 + 516 tests green (update pure-logic tests),
bundle budget (entry ≈ ≤289 kB / ≤88 kB gz; Insights chunk growth justified),
agent-browser verify en/fa × desktop/375 × light/dark, zero console errors.
