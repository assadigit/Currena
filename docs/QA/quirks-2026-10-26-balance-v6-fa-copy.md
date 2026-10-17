# QA — 2026-10-26: balance v6 copy (fa)

Round-51 review record for the two NEW Persian strings of the gold
balance's v6 revision (owner Iteration-4 directive, 2026-10-26: "Make
the Gold/Silver Balance Visually Connected to Its Factors" — the
factor tiles now REST ON real weighing pans hung from the beam). The
pans themselves carry minimal empty-state markers; the full
evidence-based lines stay in the list area below, unchanged from
round-50.

## Keys and approved fa text

| Key | EN (source of truth) | fa (approved) |
| --- | --- | --- |
| `signals.balance.panEmpty` (NEW) | No qualifying signals | نشانهٔ معتبری نیست |
| `signals.balance.panUnreadable` (NEW) | Nothing to weigh yet | هنوز چیزی برای سنجیدن نیست |

## Review notes

- Both strings are PAN INTERIOR markers — deliberately the shortest
  possible legible labels (the pan is 118px tall on mobile; anything
  longer wraps and breaks the tray's shallow proportions). The full
  explanatory sentences (`listEmptyFor` / `listEmptyAgainst` /
  `listEmptyNone`, round-50) still render in the side's list section
  below the illustration, so the evidence-based wording rule is
  preserved: the pan marker orients, the list line explains.
- `panEmpty` («نشانهٔ معتبری نیست») is the evaluated-state case: the
  evaluation ran, this side simply has no qualifying factors. It
  reuses the round-50 vocabulary «نشانهٔ معناداری» in its short form
  («نشانهٔ معتبری») — same register, no new terminology.
- `panUnreadable` («هنوز چیزی برای سنجیدن نیست») is the distinct
  "nothing could be read" case (readable 0): it names the WEIGHING
  (سنجیدن), matching the component's own metaphor vocabulary
  («سنجیده می‌شود» in the round-50 subtitle), and the «فعلاً/هنوز»
  temporality matches `verdictNone` / `listEmptyNone`. An absence of
  readings is never worded as an absence of pressure — and neither
  marker ever implies a direction.
- No CHANGED strings this round: `heading`, `subtitle`, `sideFor`,
  `sideAgainst`, the verdict words, the count line, the tray labels
  and the three list-empty lines are byte-identical to round-50.
- The EN twins follow the same rules as every balance key: no
  buy/sell vocabulary, no prediction, evaluated-state wording.

## Verification

- `pnpm run copy:audit` clean (2,154 manifest entries, 0 findings).
- fa renders verified on the harness at 360px and 1280px
  (docs/insights/screenshots/gold-balance/v6/): the markers fit their
  pans without wrapping in both themes.
