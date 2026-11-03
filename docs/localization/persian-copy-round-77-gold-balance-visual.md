# Persian copy round 77 — the gold balance's visual redesign (GB-S4 / P2b)

**Date:** 2026-11-03 · **Scope:** 14 flagged fa strings in
`apps/web/src/i18n/insights-copy-fa.ts` — the consolidated gold
balance's VISUAL redesign copy under `signals.balance` (the eyebrow +
the verdict block's eyebrow and four counts parts, the "Not leaning"
tray's title/note/empty line, the ledger rows' four state words + the
split state), rendered ONLY behind the `?balance=lanes` preview flag on
the Insights page (05-VISUAL-DESIGN-SPEC §4.1/§4.4/§4.5/§4.6 + §11's
key list).

**Basis:** the owner's gold balance consolidation program
(`docs/specs/gold-balance-consolidation/` — 05 §11's key list, this
round's review; the session plan GB-S4; the owner-approved reference
prototype `reference/balance-reference.html`'s own fa drafts, checked
against the site's established vocabulary). Nothing user-visible
changes without the flag: the default view keeps today's copy
byte-for-byte (the legacy-markup snapshot test in
`apps/web/src/components/insights/signals/gold-balance-lanes.test.tsx`
stays the pin).

## Terminology decisions

| Concept | Persian | Rationale |
| --- | --- | --- |
| The instrument's eyebrow | طلا · شرایط امروز | The reference prototype's own fa draft, kept: «طلا» + the site's «شرایط امروز» family (the balance's subtitle already says «امروز»), the middot separator matches the EN key. |
| The verdict block's eyebrow | گرایش امروز | 05 §4.4's "Today's lean": «گرایش» is the balance's own lean word since round-76's subtitle («گرایش امروز را نشان می‌دهد»); the eyebrow names the same thing the instrument answers. |
| The counts line (for/against parts) | {n} موافق · {n} مخالف | «موافق/مخالف» — round-76's own laneSplit pair (the lane counts ARE the lanes' votes; the reference's fa counts use the same words). Deliberately NOT «به نفع/به ضرر» (the legacy condition-count wording): the lanes vote, the conditions lean — two vocabularies, one site. |
| The counts line (not-leaning part) | {n} بدون گرایش | The tray title's own word (below) — the counts line names the tray's population with the same word, so one state has one name everywhere (05 §4.4's counts and §4.5's tray are the same population). |
| The counts line (unread part) | {n} ناخوانده | The reference's fa draft, kept: «ناخوانده» (not read) — distinct from «قابل ارزیابی نیست» (cannot be evaluated): the counts line states the data state in one compact word; the full phrase stays on the ledger's state word. |
| The tray title | بدون گرایش | The reference's fa draft, kept: «بدون گرایش» (without a lean) — the honest name for both neutral and unread lanes resting off the pans; states the ABSENCE, not a judgement. |
| The tray note | سنجیده شد، اما گرایش روشنی نیست | The reference's fa draft, kept: «سنجیدن» is the balance's own weighing verb; the note explains why the weights sit in the tray. |
| The tray empty line | همهٔ عوامل روی کفه‌ها هستند. | The reference's fa draft, kept: «کفه» is the established pan word (round-50's tray copy family). |
| The ledger state words | به نفع طلا / علیه طلا / بدون گرایش / قابل ارزیابی نبود | «به نفع/علیه» reuses round-76's member-group pair at the lane level; «بدون گرایش» = the tray word (one state, one name); «قابل ارزیابی نبود» follows round-76's polish of the unread title to the site's «قابل ارزیابی» family (the reference's draft «قابل‌خواندن نبود» was superseded by that decision — this round keeps the site's family). |
| The split state word | دوپاره: {supports} موافق، {pressures} مخالف | OI-2's badge word «دوپاره» + the laneSplit counts pattern: the state names the contest in words (colour never rides alone). |
| Latin tokens kept Latin | (none new) | No new tickers; the middot and Persian digits through the locale formatter. |

## Process record

1. Copy authored in `insights-copy-en.ts` + `insights-copy-fa.ts`
   (shape type-checked against `InsightsCopy`; both dictionaries gain
   the same 14 keys).
2. `pnpm copy:audit` flagged the 14 fa strings as NEW.
3. Reviewed against `persian-terminology.md` + the round-50/53/76
   gold-balance decisions: every word reuses an established family
   (گرایش، موافق/مخالف، دوپاره، به نفع/علیه، قابل ارزیابی، کفه) —
   the only new collocations are the eyebrow pair and the tray note,
   both taken from the owner-approved reference prototype's own fa
   drafts. No em dashes anywhere (pinned by the dictionary-coverage
   test).
4. Checked in the real UI context: the gb-s4 Playwright suite renders
   the fa lane view in all six scenarios × 360/1280 × light/dark
   (Persian digits in the counts line, RTL mirroring of the strip, the
   tray and the ledger, «دوپاره» beside the contested weight) — the
   screenshots are docs/specs/gold-balance-consolidation/evidence/gb-s4/.
5. Manifest updated via `pnpm copy:audit:update` — all 14 strings
   `processed`, round `round-77`, reference this document.
6. `pnpm copy:audit` exits 0 before the push.

## What this round deliberately does NOT touch

- The GB-S3 lane-view keys (round-76) — the tallies, the badge word,
  the member groups, the context line and the measured note render
  unchanged inside the new anatomy.
- The `signals.goldScore` dictionary (the wind panel's copy) — the panel
  still renders in the DEFAULT view until P5/GB-S6.
- The balance's legacy keys (`subtitle` and friends) — the default view
  is byte-stable until the flip.
- The Outlook sentences (OI-1) — GB-S5 (P4), the next fa round.
