# 01 — UX spec

**Context:** the gold and silver cards on the Insights page. One reusable card component, rendered once per asset.

## Anatomy (top to bottom)

### A. Header row
1. Show a segmented control with two options: Gold, Silver. Gold is selected by default.
2. Show "Updated {time ago} · {n} sources" at the inline-end of the row, in small muted text.
3. Make the segmented control keyboard accessible (`role="tablist"`; arrow keys move; `aria-selected`).

### B. Verdict
1. Show the verdict phrase as the largest text in the card (see file 04 for strings).
2. Show one subline: "{confidence} · {read} of {total} factors read".
3. When coverage is below the threshold, show the "Not enough readings to call" phrase instead of a lean.

### C. Beam (the hero)
1. Draw a hairline beam on a small pivot over a dotted level line.
2. Place the "supporting" end at the inline-start side and the "pressuring" end at the inline-end side. In Farsi these sides mirror together.
3. Tilt the beam so the heavier side sits lower. Use the tilt rules in file 03. Do not tilt when coverage is below threshold.
4. Place one token on the beam end for every supporting or pressuring driver. Stack tokens upward from the beam (nearest to the beam first).
5. Each token shows two lines: driver name, then state arrow plus value (for example "↘ 2.78%").
6. When a side has no drivers, show the muted text "None right now" where the first token would sit.
7. Under each end, show a caption with a count: "Supporting · 0", "Pressuring · 1".
8. Animate the beam once when the card first becomes visible (see file 02).

### D. Neutral and unread band
1. Under the beam, show up to two groups in one row. Wrap on narrow widths.
2. Group "Neutral · n": solid outline chips, one per neutral driver.
3. Group "Couldn't read · n": dashed outline chips, one per unreadable driver. Use the amber caption color.
4. Hide a group when its count is zero.
5. Tap or click on a chip scrolls to and opens the matching row (section G).

### E. Price context ("What gold is doing")
1. Show one line: current price, a short phrase for where it sits in its 10-year range, and the 30-day change.
2. Show a thin range bar with a marker for the position within the 10-year range. Label the ends "10-yr low" and "high".
3. Label the line "context, not a weight" so users know it does not move the beam.
4. Derive the short phrase from the existing price-footing state: holding, fading, or mixed (file 04).
5. Do not show "Works against" or "Works for" here. Do not use a state color on this line.

### F. Factor rows
1. Show one collapsed row for every driver, including unreadable ones, in this order: pressuring, supporting, neutral, unread.
2. Collapsed row: state icon, driver name, one plain-language effect line, current value, chevron.
3. Expanded row: a fuller plain-language explanation, a range bar showing where the value sits in its usual range, and "as of {date} · {source}".
4. Unreadable row: show the muted name, the reason (source unavailable, stale, or not available yet), and the last known value when one exists.
5. Use native `<details>`/`<summary>` or an equivalent that gives keyboard and screen-reader support.

### G. "What would flip it" line
1. Show the line only when coverage is sufficient, the lean is not balanced, and a read driver on the heavier side has a threshold in the existing config.
2. Choose the driver whose current value is closest to its threshold.
3. If no driver qualifies, hide the line. Do not invent thresholds.

### H. Footnote
Show one line: "Each factor counts equally. This is today's combined lean, not a forecast." Do not repeat the legal disclaimer here. It stays in the page footer.

## States
| State | Beam | Verdict | Notes |
|---|---|---|---|
| Sufficient coverage, lean | tilts | lean phrase + confidence | normal |
| Sufficient coverage, balanced | level | "Balanced for {asset}" | no flip line |
| Insufficient coverage | level | "Not enough readings to call" | read tokens stay on their ends |
| Nothing readable | level, both ends empty | "No readings available right now" | show unread group, hide flip line |
| Loading | skeleton: hairline beam, grey placeholders | skeleton bar | no tilt animation until data arrives |
| Full error (all sources down) | level | "We couldn't load this right now" | show a retry action |

## Interaction rules
1. Do not add hover-only controls. Every action works with tap and keyboard.
2. Keep touch targets at least 44px high for rows, chips and the segmented control.
3. Switching Gold | Silver re-renders the card and replays the beam settle animation once.
4. Persist nothing. The card needs no storage.

## Accessibility
1. Never use color alone. Every state has an icon shape and a word: pressuring ↘ (arrow down), supporting ↗ (arrow up), neutral → (dash), unread = clock icon with dashed outline.
2. Give the SVG `role="img"` with a `<title>` and `<desc>` built from the data, for example "Balance scale: 0 supporting, 1 pressuring, 3 not read. Tilts toward pressuring."
3. Make all text meet WCAG AA contrast (values verified in file 02).
4. Respect `prefers-reduced-motion`: no animation, final position only.
5. Use real headings: the verdict is an `<h3>` inside a `<section aria-labelledby>`.
6. Tab order: segmented control, chips, rows, retry.

## Mobile (container width below 520px)
1. Keep the beam drawing, scaled to the container width.
2. Hide the in-beam token text and the end captions.
3. Show two stacked lists under the beam: "Supporting · n" then "Pressuring · n", each listing the driver names with state icon and value.
4. Keep the neutral and unread band as is (it wraps).
5. Keep the price line, rows and footnote unchanged. The range bar moves below the price text.

## Metrics
- Primary: share of first-time visitors who can restate the verdict and the confidence (test with 5 people, see file 05).
- Secondary: share of card views that open at least one row.
