# Persian copy round 78 — the flipped gold summary prose (GB-S6 / P5)

**Date:** 2026-11-04 · **Scope:** 1 flagged fa string in
`apps/web/src/i18n/insights-copy-fa.ts` — `signals.metalLeanLanes`
(`'{metal}: {lean}؛ {counts}'`), the gold summary prose that joined the
lane model at the owner-gated flip (the collapsed-corner decision):
the merged card's header line and the collapsed section's gold line
now speak the BALANCE's verdict word + the lane counts line (the same
words the card renders), where the legacy sentence counted FOOTING
among 5 conditions — the circularity D-GB-5 removed. Silver keeps the
legacy per-condition sentence (`signals.metalLean``, its own model is
unchanged, OI-4).

**Basis:** the owner's gold balance consolidation program
(`docs/specs/gold-balance-consolidation/` — the GB-S6 session's corner
decision, recorded in PROGRESS.md; the copy reuses round-77's counts
parts + round-76's lane vocabulary verbatim). Since the flip there is
no flag: the prose renders for every visitor.

## Terminology decisions

| Concept | Persian | Rationale |
| --- | --- | --- |
| The summary shape | {metal}: {lean}؛ {counts} | Mirrors the legacy sibling `metalLean`'s shape (a colon, the lean, the `؛` separator) so the two metals' lines read as one family in the header's stacked pair; the counts parts join with ' · ' exactly as the verdict block renders them (round-77). No trailing period — the EN sibling carries none, and the collapsed line's footing clause follows with its own separator. |
| The lean slot | «متعادل» / «تمایل به نفع طلا» / «تمایل به ضرر طلا» / «فعلاً قابل ارزیابی نیست» | The balance's own verdict words (round-76), passed by `balanceVerdictWordOf` — the same words the card's hero renders; one rule home, no drift. |
| The counts slot | «۰ موافق · ۰ مخالف · ۴ بدون گرایش» | round-77's counts parts verbatim («موافق/مخالف/بدون گرایش» + «ناخوانده» when > 0), Persian digits through the locale formatter — the card's own counts line, word for word. |

## Process record

1. Copy authored in `insights-copy-en.ts` + `insights-copy-fa.ts`
   (shape type-checked against `InsightsCopy`; both dictionaries gain
   the same one key).
2. `pnpm copy:audit` flagged the 1 fa string as NEW.
3. Reviewed against `persian-terminology.md` + the round-76/77
   gold-balance decisions: every word reuses an established family —
   no new collocations at all (the verdict words and the counts parts
   are the card's own). No em dashes (pinned by the moved
   dictionary-coverage test in gold-balance-lanes.test.tsx).
4. Checked in the real UI context: the collapsed section and the card
   header render the Persian verdict word + Persian counts with
   Persian digits (pinned by the lanes test's fa collapsed-prose test);
   the em-dash ban is pinned by the coverage test.
5. Manifest updated via `pnpm copy:audit:update` — the 1 string
   `processed`, round `round-78`, reference this document.
6. `pnpm copy:audit` exits 0 before the push.

## What this round deliberately does NOT touch

- `signals.metalLean` (silver's legacy sentence — OI-4) and every other
  key; the wind copy keys stay until OI-3/GB-S7.
