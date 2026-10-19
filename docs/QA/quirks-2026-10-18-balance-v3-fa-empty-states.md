# QA — 2026-10-18: balance v3 empty-state copy (fa)

Round-48 review record for the two Persian strings added with the gold
balance v3 revision (owner directive 2026-10-18d): the factor lists under
the balance now carry a concise, evidence-based empty state when a side
has no qualifying factors (replacing the retired dashed placeholder).

## Keys and approved fa text

| Key | EN (source of truth) | fa (approved) |
| --- | --- | --- |
| `signals.balance.listEmptyFor` | No readings support gold right now. | فعلاً هیچ عامل به نفع طلا دیده نمی‌شود. |
| `signals.balance.listEmptyAgainst` | No readings work against gold right now. | فعلاً هیچ عامل به ضرر طلا دیده نمی‌شود. |

## Review notes

- Vocabulary follows the existing balance copy exactly: «به نفع طلا» /
  «به ضرر طلا» are the approved side captions (`sideFor`/`sideAgainst`),
  so each empty line names its side with the page's own words.
- Evidence-based, not predictive: «دیده نمی‌شود» (is not seen) states
  what the readings show, matches the count line's honesty, and adds no
  forecast — the spec's §16 "do not word anything as a prediction".
- No em dashes; ZWNJ (نیم‌فاصله) used in «حیچ … نمی‌شود» construction
  («عامل» stands alone; the negation verb «دیده نمی‌شود» carries the
  standard ZWNJ between «نمی» and «شود»).
- Checked in the real UI context (RTL, Vazirmatn, Persian digits) in the
  v3 verification session — the lines render under their list headings
  without wrapping issues at 360 px.
