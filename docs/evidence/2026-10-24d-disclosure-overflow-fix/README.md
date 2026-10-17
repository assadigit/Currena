# 2026-10-24d — the «جزئیات بیشتر» white-space fix (owner-reported)

The owner's report: on the live deployment, clicking «جزئیات بیشتر» /
"More details" showed "just a white space with no more extra detail",
and the prices block read as collided with the markets (index) section
below it.

## Root cause

The card-body click-through button carried `h-full` (height:100%). The
tile `article` is a stretched grid item: once the disclosure opened, the
grid row grew to fit card + trigger + panel, the article stretched to
the row, and the body button resolved `h-full` against the FULL
stretched article height — pushing the disclosure trigger and the
expanded panel BELOW the tile's box. The panel kept its DOM/aria state
(which is why the 2026-10-24c round's aria-based verification passed)
but painted UNDER later DOM siblings: the Silver/Brent tiles on mobile,
the markets section on desktop. Visually: ~690px of white space where
the details should be, and the "collision" with the markets section.

## Fix

- `article`: `price-row scroll-mt-24 flex h-full flex-col …`
- body button: drops `h-full`, keeps `grow` — it fills only the space
  the disclosure leaves it, so the trigger + panel stay INSIDE the tile
  and the tile grows naturally with the open panel (spec 02 §5). Equal
  tile heights preserved via grid stretch + `grow`.
- prices section gains `pb-3` → 40px of air to the markets block (the
  page-wide 28px rhythm untouched).

## Evidence

| File | State |
|---|---|
| `BEFORE-live-mobile-375-whitespace.png` | LIVE worker 7b939901, mobile 375 fa — DOM says the panel is open (880 chars, 4 sections) but the pixels show white space: the Silver/Brent tiles paint over the overflowing panel |
| `BEFORE-live-mobile-375-whitespace2.png` | same session, second capture — VLM confirms blank area under the trigger |
| `BEFORE-2026-10-24c-evidence-desktop-expanded.png` | the 2026-10-24c round's own "expanded" evidence — the defect is visible there in hindsight (white space below the briefing; the panel never painted inside the tile) |
| `AFTER-desktop-1280-en-expanded.png` | fixed build — panel renders inside the Gold tile; Silver/Oil/Bitcoin un-overlapped; clean spacing to the markets section |
| `AFTER-mobile-375-en-expanded.png` | fixed build — panel inside the tile; Silver 10px below the grown tile |
| `AFTER-mobile-375-fa-rtl-expanded.png` | fixed build, fa RTL — Persian rows render; 40px air to the markets section |

Verification method (beyond screenshots): `elementFromPoint` probes at
the panel's own coordinates hit the panel's rows (not the neighbouring
tiles); panel bounding box fully inside its tile's box; collapsed grid
restores four equal tiles; no horizontal overflow at 375px. Gates:
typecheck 6/6, lint clean, web 533 green, copy:audit clean, budgets
held (entry 295.29/88.82; Insights 624.64/149.59 vs 626/150).
