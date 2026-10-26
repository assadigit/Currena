# QA — 2026-10-25: balance v4 copy (fa)

Round-50 review record for the Persian strings of the gold balance's
v4 revision (owner Iteration-2 directive, 2026-10-25: "Refine the
Gold/Silver Balance into a Premium Editorial Visualization"). The
block now leads with the concept's own heading «برآیند عوامل مؤثر بر
قیمت طلا» + an explanatory subtitle, the two factor lists carry
descriptive side labels, and the empty states are worded by the actual
evaluation state.

## Keys and approved fa text

| Key | EN (source of truth) | fa (approved) |
| --- | --- | --- |
| `signals.balance.heading` (NEW) | The aggregate of factors affecting the price of gold | برآیند عوامل مؤثر بر قیمت طلا |
| `signals.balance.subtitle` (NEW) | Each factor is read against its usual range and weighed equally; the beam shows the combined lean of today’s readings. | هر عامل در مقایسه با دامنهٔ معمول خود خوانده و هم‌وزن سنجیده می‌شود؛ شیب تیر، برآیند امروز این عوامل را نشان می‌دهد. |
| `signals.balance.listEmptyNone` (NEW) | Nothing could be read yet, so neither side has been weighed. | فعلاً هیچ عاملی قابل خواندن نبود؛ بنابراین هیچ سویی سنجیده نشده است. |
| `signals.balance.sideFor` (CHANGED) | Factors supporting gold’s price | عوامل حمایتی از قیمت طلا |
| `signals.balance.sideAgainst` (CHANGED) | Factors pressuring gold’s price | عوامل فشارآور بر قیمت طلا |
| `signals.balance.listEmptyFor` (CHANGED) | None of the factors checked shows a meaningful signal supporting gold’s price right now. | در حال حاضر، نشانهٔ معناداری از حمایت عوامل بررسی‌شده از رشد قیمت طلا دیده نمی‌شود. |
| `signals.balance.listEmptyAgainst` (CHANGED) | None of the factors checked shows a meaningful signal working against gold’s price right now. | در حال حاضر، نشانهٔ معناداری از فشار عوامل بررسی‌شده بر قیمت طلا دیده نمی‌شود. |

## Review notes

- `heading` is the owner's own title for the concept, verbatim from the
  Iteration-2 prompt («برآیند عوامل مؤثر بر قیمت طلا»); the metal is
  gold (the balance is applied to the gold driver list only, spec §2.6).
- `sideFor`/`sideAgainst` are the owner's proposed side labels from the
  same prompt, verbatim («عوامل حمایتی از قیمت طلا» /
  «عوامل فشارآور بر قیمت طلا»); the EN twins reuse the site's own
  vocabulary ("supportive"/"pressuring" naming, no buy/sell words).
- `listEmptyFor` is the owner's suggested wording verbatim
  («در حال حاضر، نشانهٔ معناداری از حمایت عوامل بررسی‌شده از رشد
  قیمت طلا دیده نمی‌شود.»); `listEmptyAgainst` is its exact mirror
  (فشار … بر قیمت), evaluated-state wording: evidence-based, no
  prediction, and no implication that absence of pressure means prices
  will rise.
- `listEmptyNone` keeps the two "nothing could be read" cases distinct
  from the "no qualifying factors" case (Iteration-2 §5): the empty
  side never claims an evaluation that did not happen; the unavailable
  verdict + the «قابل ارزیابی نیست» tray carry the rest.
- `subtitle` states the model's own rules (read against the usual
  range, equal weights — spec §4/§16) and describes today's pressure,
  not a forecast; «شیب تیر» names the beam with the common word for a
  seesaw bar, matching the drawing.
- No em dashes; ZWNJ (نیم‌فاصله) used per site convention
  («می‌شود», «دیده نمی‌شود», «بررسی‌شده», «هم‌وزن»).
- Checked in the real UI context (RTL, Vazirmatn, Persian digits) on
  the local harness at 1280 and 360 — the heading, subtitle and both
  side labels render on one line at 360 with the lists stacked; the
  empty lines wrap cleanly inside their columns.
