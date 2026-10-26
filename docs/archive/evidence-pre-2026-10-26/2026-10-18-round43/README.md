# Evidence — Round 43: the grades wear their colors again (2026-10-18)

Owner's five asks: revert the grade colors · think for AUS's white space ·
better "?" tip placements · bullets at the sentence start · a container
around the bullets. All shipped (QA table:
`docs/QA/quirks-2026-10-18-round43.md`).

Local harness (vite :3000 + the read-only :8787 forwarder serving
production data):

| File | What it shows |
|---|---|
| `fa-dark-desktop-hero.png` | fa · dark · 1280 — colored meters (green/yellow/orange), rule tip seated in the first group's header, how-tip on the verdict row, visible alert box, bullets at sentence starts, AUS leading with 6 tiles |
| `fa-light-desktop-hero.png` | fa · light · 1280 — same structure in the light theme (the alert tint reads clearly) |
| `en-light-desktop-hero.png` | en · light · 1280 — LTR mirror: tips at the row ends, bullets at left starts |
| `en-dark-desktop-hero.png` | en · dark · 1280 |
| `fa-dark-rule-tip-open.png` | the verdict-rule panel wrapped full-width INSIDE the first group box (below the chip + "?" that hosts it) |
| `fa-dark-how-tip-open.png` | the how-computed panel wrapped full-width BELOW the verdict row |
| `fa-dark-375-hero.png` | fa · dark · 375 — verdict row fits with the seated tip, no bleed (scrollWidth 375) |
| `en-light-375-hero.png` | en · light · 375 |
| `fa-dark-alert-box-zoom.png` | 2× zoom of the alert box — each bullet's dot beside the FIRST line (the old ::marker sat beside the wrapped line) |

Production (currena.ir, post-deploy of `7b5f7896` from `d643353`):

| File | What it shows |
|---|---|
| `prod-en-light-hero.png` | production EN light — meters colored, 2 seated tips per card, AUS 6 tiles |
| `prod-fa-dark-hero.png` | production fa dark |
| `prod-fa-dark-375.png` | production fa dark · 375 — scrollWidth === 375 |
| `prod-fa-dark-rule-tip-open.png` | production: the rule tip's panel open inside the group box + Global's reveal clicked (tiles 3 → 6) |

Zero console/page errors at capture time (local and production).
