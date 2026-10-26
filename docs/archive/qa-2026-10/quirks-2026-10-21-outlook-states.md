# QA record — 2026-10-21 — the gold/silver outlook states (round-45 copy)

## The bug report (owner, verbatim)

> Found a bug :
>
> In English for silver and gold, currently it says works against.
>
> in farsi it says:
> شرایط موجود با الگوی معمول هم‌خوانی ندارد
>
> these are not same thing.
>
> investigate and fix the issue

Root cause confirmed: the strip's verdict slot carried `signals.verdictDown`,
whose EN ("Works against" — a short directional word against the metal) and
fa («شرایط موجود با الگوی معمول هم‌خوانی ندارد» — a sentence about the
*usual pattern* not holding, a leftover of the old "pattern conformance"
framing) had drifted into saying different things. The two locales shared a
key but not a meaning.

## The owner's complete state list (verbatim)

Gold Market Outlook — Complete State List:

| State          | Persian                                                                 | English                                                          |
| -------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Strong Bullish | نشانه‌ها حاکی از احتمال رشد قابل‌توجه قیمت طلاست.                        | Signs point to a potential significant rise in gold prices.      |
| Bullish        | نشانه‌ها حاکی از احتمال رشد قیمت طلاست.                                 | Signs point to a potential rise in gold prices.                  |
| Neutral        | نشانه‌ها حاکی از چشم‌اندازی خنثی برای قیمت طلاست.                        | Signs point to a neutral outlook for gold prices.                |
| Range-Bound    | نشانه‌ها حاکی از نوسان قیمت طلا در محدوده‌ای مشخص است.                   | Signs point to gold prices trading within a defined range.       |
| Bearish        | نشانه‌ها حاکی از احتمال افت قیمت طلاست.                                 | Signs point to a potential decline in gold prices.               |
| Strong Bearish | نشانه‌ها حاکی از احتمال افت قابل‌توجه قیمت طلاست.                        | Signs point to a potential significant decline in gold prices.   |
| Mixed Signals  | نشانه‌های بازار درباره جهت حرکت قیمت طلا یکدست نیستند.                   | Market signals for gold prices are mixed.                        |

Recommended state logic (owner, verbatim):

- Strong Bullish: Strong signals favor upward movement.
- Bullish: Signals favor upward movement.
- Neutral: No clear directional bias.
- Range-Bound: Price is expected to fluctuate within a relatively defined
  range, without a clear breakout direction.
- Bearish: Signals favor downward movement.
- Strong Bearish: Strong signals favor downward movement.
- Mixed Signals: Indicators conflict, making the likely direction unclear.

Important distinction (owner, verbatim): Neutral and Range-Bound should not
be treated as identical. A neutral outlook means there is no clear
directional bias; a range-bound outlook specifically suggests that prices
may remain within a defined trading range. Mixed Signals means the
indicators disagree.

"For your financial website, I recommend using these seven states as the
complete classification, provided your indicator model can reliably
distinguish between them."

## The mechanical mapping shipped (round-45)

The seven states replace the old `up/down/flat` tally in
`apps/web/src/components/insights/signals/verdict.tsx` (`outlookOf`), over
the same condition tally the card already shows (gold 5 conditions, silver 6;
S = supportive, A = against):

1. every condition unreadable → `null` (verdictNone, «هنوز نمی‌توان
   نتیجه‌گیری کرد») — unchanged edge state;
2. S ≥ 4 → strong-bullish / A ≥ 4 → strong-bearish — the card lean's OWN
   "strong" bar (`LEAN_STRONG = 4`, now exported from `@currena/insights`),
   so one strength definition speaks across the card; ≥4 of ≤6 conditions
   always implies the majority;
3. range-bound — the driver split is within one AND the price itself
   consolidates: `|change30d| < RANGE_SPEED_PCT (2%)` with the price in the
   *typical* band of its 10-year range. The owner's distinction is honoured:
   Neutral is the no-bias state (readable conditions all sit neutral);
   Range-Bound is the affirmative "trades within a defined range, no
   breakout" read and therefore REQUIRES the quiet-mid-range price
   evidence; Mixed (S = A > 0, indicators disagree) keeps the conflict case
   when the price is NOT quiet;
4. S > A → bullish / A > S → bearish (a majority favors the move);
5. S = A > 0 → mixed; S = A = 0 → neutral.

## Copy shipped (round-45 manifest entries)

- The gold sentences are the owner's verbatim strings (EN + fa), pinned by
  `outlook.test.ts`; the silver sentences mirror them (قیمت طلا → قیمت نقره).
- `signals.verdictStates.<state>.{gold,silver}` — 14 new fa entries; the
  strip chips carry the full sentence for the metal's state.
- `signals.verdictStateNames.<state>` — 7 new fa entries (صعودی قوی /
  صعودی / خنثی / محدوده‌ای / نزولی / نزولی قوی / نشانه‌های مختلط) for the
  collapsed line's short takeaway.
- `signals.verdictTitle` CHANGED: «شرایط فعلی» → «چشم‌انداز» (the strip now
  heads the outlook, not the tally; EN "Outlook").
- `signals.collapsedVerdict` CHANGED: «جمع‌بندی: {verdict}» →
  «چشم‌انداز: {verdict}» (EN "Outlook: {verdict}").
- `signals.verdictUp` / `signals.verdictDown` / `signals.verdictFlat`
  REMOVED (the drift is structurally impossible now: one state machine,
  paired authored sentences).
- The signals CSV section header no longer reuses `verdictTitle` (the row
  status value is the checklist lean) — it uses the generic
  `ui.csvColStatus` like the other sections.
