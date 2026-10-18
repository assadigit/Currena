# 02 — Visual spec

**Context:** visual design of the gold and silver cards. The look is calm, analytical and editorial, and it stays clearly part of Currena. The reference HTML shows the exact result.

## Rules for the agent
1. First inspect the repo for existing design tokens (CSS variables, Tailwind config, theme file). If the Insights page already defines page background, card surface, text and border tokens, reuse them for those four roles and add only the new tokens below.
2. If no token system exists, add the tokens below as CSS custom properties scoped to the card (`.gold-card` or the repo's naming style).
3. Use one family for the whole card: the site's existing Latin and Farsi UI font. Do not add a new font.

## Color tokens
Names follow role + scale. Components read only the **semantic** tokens. The scale values exist for later extension.

### Semantic tokens — light theme
```css
:root {
  --gc-surface: #FFFFFF;
  --gc-surface-tint: #F3F7FA;
  --gc-hairline: #D9E1E8;        /* decorative lines */
  --gc-control: #7B8A98;         /* non-text UI: dashed outlines, chips (3.5:1) */
  --gc-text: #14212B;
  --gc-text-2: #4A5A68;
  --gc-text-muted: #5F6E7C;
  --gc-supports: #1A7A3A;  --gc-supports-bg: #E8F5EC;  --gc-supports-border: #A9D6B8;
  --gc-pressures: #B3243A; --gc-pressures-bg: #FBEDEF;  --gc-pressures-border: #E4A6AF;
  --gc-unread: #8A5A00;    --gc-unread-bg: #FFF4DC;
  --gc-accent: #1F6F8B;          /* focus ring, links */
}
```
### Semantic tokens — dark theme
```css
[data-theme="dark"] {            /* use the repo's existing dark-mode selector if it has one */
  --gc-surface: #10161C;
  --gc-surface-tint: #141C23;
  --gc-hairline: #26313B;
  --gc-control: #6B7B8A;
  --gc-text: #E8EDF2;
  --gc-text-2: #A9B6C2;
  --gc-text-muted: #8A98A6;
  --gc-supports: #4CC38A;  --gc-supports-bg: #12281F;  --gc-supports-border: #2F6B4C;
  --gc-pressures: #F2828C; --gc-pressures-bg: #2B171B;  --gc-pressures-border: #7A3A44;
  --gc-unread: #E7B04A;    --gc-unread-bg: #2B2210;
  --gc-accent: #6CC3E0;
}
```
### Scale tokens (reference, light-theme anchors)
```css
:root {
  --slate-50:#F6F7F8; --slate-100:#EBEDF0; --slate-200:#D2D9DF; --slate-300:#B2BDC8; --slate-400:#8E9FAE; --slate-500:#6A8195; --slate-600:#596C7D; --slate-700:#4A5A68; --slate-800:#2F3942; --slate-900:#1F2429;
  --green-100:#E3F7EA; --green-500:#2DD264; --green-700:#1A7A3A; --green-800:#145C2C;
  --red-100:#F6E4E6; --red-500:#C03040; --red-700:#83212C;
  --amber-100:#FCF1DE; --amber-500:#FFA200; --amber-700:#9A6200; --amber-800:#704700;
  --teal-100:#E4F2F7; --teal-700:#1F6F8B; --teal-800:#14495C;
}
```
### Verified contrast (WCAG, computed)
| Pair | Ratio | Result |
|---|---|---|
| Light: text on surface | 16.38 | AAA |
| Light: text-2 on surface | 7.11 | AAA |
| Light: muted on surface / on tint | 5.24 / 4.86 | AA |
| Light: supports on surface / on its tint | 5.40 / 4.81 | AA |
| Light: pressures on surface / on its tint | 6.50 / 5.72 | AA |
| Light: unread on surface / on its tint | 5.93 / 5.43 | AA |
| Light: control (dashed outline) on surface | 3.54 | passes 3:1 for UI |
| Dark: text / text-2 / muted on surface | 15.45 / 8.81 / 6.17 | AAA / AAA / AA |
| Dark: supports / pressures / unread / accent on surface | 8.22 / 7.24 / 9.28 / 9.12 | AAA |
| Dark: supports on its tint / pressures on its tint | 7.03 / 6.73 | AAA |
| Dark: control on surface | 4.18 | passes |

If the host page uses a different card surface, recompute these pairs. Do not ship a pair below 4.5:1 for text or 3:1 for outlines.

### Why these colors
Finance context calls for blue-slate and deep green, and red kept restrained (small areas only, never a large fill). Slate-blue neutrals carry the editorial calm. Amber is used only for "couldn't read", so the three states (supports, pressures, unread) never share a hue. The palette is timeless-leaning: neutral base, two semantic hues, one quiet accent.

## State styling (tokens on the beam, chips, rows)
| State | Fill | Border | Text | Icon |
|---|---|---|---|---|
| Supports | supports-bg | supports-border, solid | supports | arrow up-right |
| Pressures | pressures-bg | pressures-border, solid | pressures | arrow down-right |
| Neutral | surface-tint | control, solid | text-2 | dash |
| Unread | none | control, dashed (4 3) | text-muted (caption in unread) | clock |

## Typography
Use the existing family. Use these sizes and weights (Latin and Farsi alike).
| Role | Size | Weight | Notes |
|---|---|---|---|
| Verdict | 22px (20px on mobile) | 600 | line-height 1.3 |
| Subline | 13px | 400 | text-2 |
| Token name | 12px | 500 | |
| Token value | 12px | 400 | tabular figures |
| Caption (counts, groups) | 12px | 500 | |
| Row name | 14px | 500 | |
| Row effect line | 13px | 400 | text-2 |
| Meta (updated, as of) | 12px | 400 | text-muted |
Use tabular figures for all numbers (`font-variant-numeric: tabular-nums`). Never use a weight above 600.

## Spacing and shape
- Spacing scale: 4, 8, 12, 16, 24, 32 px. Use only these.
- Card: padding 20px (16px on mobile), radius 12px, 1px hairline border, flat surface, no shadow, no gradient.
- Token: 156 × 44 (SVG units), radius 6. Chip: height 30px, radius 6, padding-inline 10px.
- Rows: height at least 44px, 1px hairline separators, no card-in-card nesting.

## Beam geometry (SVG viewBox width 680)
All constants are SVG user units.
```
CX = 340            pivot x
HALF = 240          pivot to beam end
TOKEN_W = 156, TOKEN_H = 44, TOKEN_GAP = 6, TOKEN_LIFT = 10
maxStack = max(1, supportsCount, pressuresCount)
BEAM_Y = 44 + maxStack*TOKEN_H + (maxStack-1)*TOKEN_GAP + TOKEN_LIFT
svgHeight = BEAM_Y + 72
level line:   y = BEAM_Y, x from 24 to 656, 1px, dotted (2 4), color control
pivot:        circle r=5 at (CX, BEAM_Y); triangle (CX,BEAM_Y+5) (CX-14,BEAM_Y+30) (CX+14,BEAM_Y+30); base line y=BEAM_Y+30 from CX-44 to CX+44; 1px text-2
beam:         line from (CX-HALF, BEAM_Y) to (CX+HALF, BEAM_Y), 2px, color text; rotates about (CX, BEAM_Y)
end nodes:    circle r=5; heavier end filled with its state color, lighter end hollow with its state color outline
token i:      y = BEAM_Y - TOKEN_LIFT - TOKEN_H - i*(TOKEN_H+TOKEN_GAP), centered on its end x
captions:     y = BEAM_Y + 56, centered on each end x
dy (px):      HALF * sin(|tilt| degrees); heavier-side tokens move down by dy, lighter-side tokens move up by dy
supports end x = CX - dir*HALF, pressures end x = CX + dir*HALF   (dir = +1 LTR, -1 RTL)
rotation (deg) = tilt * dir     (tilt > 0 means pressures heavier)
```

## Motion
1. On first reveal, rotate the beam from 0 to its final angle in 800ms with `cubic-bezier(.2,.8,.2,1)` (one smooth settle, no bounce). Move the tokens with the same duration and easing.
2. On a data refresh or a Gold | Silver switch, repeat the same animation once.
3. Under `prefers-reduced-motion: reduce`, set the final transform with no transition.
4. Animate only `transform`. Do not animate layout properties.

## RTL rules
1. Use logical CSS properties everywhere (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`). Do not use `left` and `right`.
2. Mirror the beam by position: supports at the inline-start end. Compute end x with `dir` as above.
3. Do not mirror trend arrows, check marks or clock icons.
4. Keep chart and range-bar time or value order as the host page does (time stays left to right in charts).
5. Wrap every number, price and signed percentage in an isolated LTR run (`<bdi>` or `direction: ltr; unicode-bidi: isolate`) so the minus sign and currency stay in place.
6. Use Persian digits in the Farsi version and Jalali dates for any date shown.
