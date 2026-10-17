# QA — 2026-10-26d: balance v7 copy (fa)

Round-52 review record for the ONE new Persian string of the gold
balance's v7 revision (owner Iteration-5 addendum, 2026-10-26:
"Rotate the beam only, and visualize weight" — a needle + three-tick
arc gauge now reads the beam's tilt). The whole mechanical drawing is
one `role="img"` whose label is the needle's text equivalent, so the
gauge never relies on colour alone.

## Keys and approved fa text

| Key | EN (source of truth) | fa (approved) |
| --- | --- | --- |
| `signals.balance.gaugeAria` (NEW) | Beam tilt: {n}°, {verdict}. | شیب تیر: {n} درجه، {verdict}. |

## Review notes

- The string is the NEEDLE's accessible reading: the angle in Persian
  digits (via the shared `{n}` interpolation + `formatNumber` with
  `fa-IR`), the unit «درجه», and the existing verdict word
  (`verdictFor` / `verdictAgainst` / `verdictBalanced`, round-50) —
  no new terminology, no numbers the model does not produce.
- «شیب تیر» reuses the round-50 subtitle's own vocabulary
  («شیب تیر، برآیند امروز این عوامل را نشان می‌دهد»), so the aria
  label speaks the same register the sighted reader already met.
- The EN twin carries the degree sign; the fa form uses the word
  «درجه» per the corpus's number-unit convention (digits then unit).
- No CHANGED strings this round: `heading`, `subtitle`, the side
  captions, the verdict words, the count line, the pan markers
  (round-51) and the three list-empty lines are byte-identical to
  round-51.
- No buy/sell vocabulary, no prediction; the label describes the
  drawing's measured state only — the same rules every balance key
  follows.

## Verification

- `pnpm run copy:audit` clean for the manifest (2,170 entries; the
  only remaining findings are the temporary verification harness's
  two synthetic labels, which are deleted before the round's commit).
- fa aria rendered and asserted in balance.test.tsx:
  «شیب تیر: ۲ درجه، تمایل به ضرر طلا.» for the case-A fixture.
