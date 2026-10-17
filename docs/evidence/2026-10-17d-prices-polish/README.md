# Evidence — 2026-10-17d — the prices polish (sign inks, titles, hero glitch, N2)

The owner's four-point follow-up after the dollar convention round:

1. "Show the - negative percents with red and positive percents with green
   for example in here:" (a prices-board change row).
2. "In prices section, enlarge the title of each section like OIL Dollar
   Gold Gas bold and clear." + "do the same for here" (the metal chip
   header) — "silver gold must be written much larger."
3. "comply with capital letters, the first letter is capital. so silver is
   wrong, write Silver. Be professional."
4. The hero's big-move line "seems glitchy" (screenshot: the fa fed-rate
   mover read «… آمریکا واحد درصد ۳۰ روز +۰/۲۵») + "Remove this or
   relocate to bottom footer" for the short disclaimer + the
   «درباره این داده‌ها ↧» button.

## What shipped

- **Sign inks** — new `changeToneClass` (config/display.ts): positive →
  `--color-status-normal` (green), negative → `--color-status-alert`
  (red), zero/absent neutral. Applied to the four change rows, the 6m/1y
  fact bullets and the hero mover value. The tokens are the owner
  palette's contrast-documented pair.
- **Titles** — prices-board tile names 14px→18px bold primary; metal chip
  names 14px→20px bold primary (the price stays the lighter end).
- **EN capitalization** — `signals.metals` `{ gold: 'Gold', silver:
  'Silver' }` (chips, merged rows, collapsed lines, export Name column);
  every other EN display name audited — already capitalized.
- **The glitch fixed structurally** — new `formatChangeParts` splits the
  signed number from the WORD unit; the hero renders the number in its
  own ltr island and the unit («واحد درصد» / 'pts') as the next element,
  so RTL reads «+۰٫۲۵ واحد درصد ۳۰ روز» and EN reads "+0.25 pts 30-day".
  `formatChange` delegates to it (composed output byte-identical —
  pinned by the existing tests).
- **N2 retired** — the hero no longer carries the short disclaimer line
  or the about-jump button: the page-bottom About section holds the full
  text and the global footer already carries the app-wide non-advice
  disclaimer; the top nav chips still jump to About.

## Verification

See `measurements.txt` — served chunks sha256-identical, sign colors
sampled live (green rgb(36,161,72) / red rgb(218,30,40)), title sizes
18px/20px bold, chip "Gold" capitalized, mover line order fixed in both
locales, `role="note"` ×0 at the page top, 375 scrollWidth === 375, zero
errors. Deployed currena-api `8caff087-39fd-4026-b6ad-3274fa5ff77b`.

Copy workflow: NO fa string changed this round — `pnpm copy:audit` clean
without a manifest touch (the EN metals capitalization is not tracked;
fa طلا/نقره carry no case).

## Contents

- `fa-desktop-insights.png` / `fa-mobile-375-insights.png` — the fa board
  (red/green rows, big titles) and the metals chips («طلا» 20px).
- `en-desktop-insights.png` — the EN board + "Gold" chip title.
- `measurements.txt` — hashes + the full verification log.
