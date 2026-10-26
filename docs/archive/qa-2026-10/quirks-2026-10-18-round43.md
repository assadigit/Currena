# QA — Round 43: the grades wear their colors again (2026-10-18)

Owner feedback on the round-42 hero verdict cards: "Revert colors back to
the situation grades." / "Now a considerable white space is created for
AUS, because it has no items to mention, we need to think for that." /
"the place of 'help tool tip' needs better placements" / "the bullet
points aren't at the beginning of the sentence" / "add a container around
bullet points." Five asks, all shipped this round.

| # | Ask (owner) | Disposition | Where |
|---|-------------|-------------|-------|
| 1 | "Revert colors back to the situation grades." | SHIPPED — the four-segment meters wear the FOUR-STEP status inks again at every size (green `--color-status-normal` / yellow `--color-status-watch` / orange `--color-status-stressed` / red `--color-status-alert` — the owner-pinned Carbon palette). The round-36/42 neutral-ink decree is REVERSED by this ask; the round-42 doc note ("do not restore the status rainbow") is superseded. Scope: the meters only — the verdict word keeps its tone ink, the group word chips stay quiet neutral labels, the tiles stay neutral surfaces (only the grades were asked back). | `index.css` `.verdict-meter-seg.on-*` (rides into the hero, the grouped rows, MarketsVerdict, QuestionGroup) |
| 2 | "A considerable white space is created for AUS, because it has no items to mention, we need to think for that." | SHIPPED, two moves — (a) the attention module flows from the TOP: the R40 bottom-anchor (`mt-auto`) turned the missing bullets into a mid-card hole; the spare now falls to the card's bottom inside edge (reads as padding; the R30 equal-height stretch STAYS — the alternative, natural card heights, was A/B-tested in the browser and rejected: it recreates the R30-roasted "void under Australia" beside the taller card). (b) the bullet-less card leads with SIX of its own attention tiles instead of three (no reveal chip) — Australia's real "items to mention" fill the space the alert box would have taken. Cards with bullets keep 3 + "+n more". | `VerdictMeter.tsx` module + `baseReveal` |
| 3 | "The place of 'help tool tip' needs better placements." | SHIPPED — both tips seat at their subjects: the verdict-rule tip («مبنای تعیین وضعیت هر حوزه») sits INSIDE the first status group's header, beside the word it explains; the how-computed tip («این نتیجه چگونه محاسبه می‌شود؟») rides the verdict row itself (the result it explains). The lone floating "?" pills are gone. `GlossaryTip` gains an optional `panelClassName` (backward-compatible) so panels hosted in flex rows wrap onto their own full-width line instead of squeezing the row. Edge cases kept: the noSummary branch hosts the tip inline (block flow), the no-gauges branch keeps the standalone fallback. | `VerdictMeter.tsx` verdict row + group header; `GlossaryTip.tsx` |
| 4 | "The bullet points aren't at the beginning of the sentence." | SHIPPED — root cause found: each `<li>` held one inline-block BUTTON, whose baseline is its LAST text line; the CSS `::marker` aligned to that baseline, so on wrapped items the dot landed beside the second line (verified by zoomed screenshot before the fix). Each bullet now carries an explicit flex marker (one shared `BULLET_DOT` element, `items-start`) pinned beside the FIRST line — the sentence start in both directions (right in fa, left in en). DOM-verified: dot's inline-start edge ≥ text's, same line top. | `VerdictMeter.tsx` `BULLET_DOT` |
| 5 | "Add a container around bullet points." | SHIPPED — the round-42 container existed but was effectively invisible in the light theme (`bg` 5% + ring 60% of an already-light border). It is now a clearly visible soft alert-tinted bounded box: `ring-[--color-status-alert]/25` + `bg-[--color-status-alert]/5` + a touch more padding — quiet enough not to re-introduce the "too much color" noise, tinted because the words it groups are the alerts. | `VerdictMeter.tsx` `data-attention-box` |

## Scope discipline

- **No copy changes** — zero new/retired strings in either locale; the
  copy manifest untouched; `copy:audit` ran clean.
- **No data/scoring/behaviour changes** — presentation only. The meters'
  colour revert is CSS; the 6-tile rule is a presentational reveal
  default (`baseReveal = hasBullets ? 3 : 6`); the reveal interaction
  itself is unchanged (re-tested on Global: 3 → 6 tiles).
- **Sacred surfaces untouched** — `packages/core/src/schemas.ts` and the
  i18n corpora untouched.

## Verification

- 1,325 tests green (core 191 · scraper 67 · insights 403 · markets 13 ·
  api 208 · web 443 — every suite matches its pre-round count);
  typecheck 6/6; lint 0 errors / 15 accepted advisories (D-24);
  copy:audit clean; budgets held — Insights lazy **603.84/142.59** vs
  604/142.8 (the deduped `BULLET_DOT` element absorbed the round's JSX
  growth; NO budget bump), entry untouched 294.75/88.53.
- Browser-verified en/fa × light/dark × 375 px/desktop (vite + prod
  data): meters wear the four-step colours, both tips seat + expand
  (tap + keyboard; panels wrap below their rows), the alert box is
  visible in both themes, bullet dots at sentence starts, AUS leads
  with 6 tiles, Global keeps box + 3 tiles + reveal (re-click verified
  3 → 6), 375 px `scrollWidth === 375`, zero console/page errors.
- Production (currena.ir, post-deploy): meter on-1 computed
  `rgb(36, 161, 72)`; exactly 2 tips per card; `ausTiles` = 6; 3 flex
  bullet dots; rule tip opens (panel content verified); reveal works;
  zero page errors after the one-reload SW cycle.

## Evidence

`docs/evidence/2026-10-18-round43/` — 12 screenshots (en/fa × light/dark
desktop heroes, both tips open, 375 px both locales, the alert-box zoom
showing the marker fix, 3 production shots).
