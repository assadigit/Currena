# Persian copy round 77 — the consolidated gold balance's visual redesign (GB-S4 / P2b)

**Date:** 2026-11-04 · **Scope:** 19 flagged fa strings in
`apps/web/src/i18n/insights-copy-fa.ts` — the P2b VISUAL redesign's copy
under `signals.balance`, rendered ONLY behind the `?balance=lanes`
preview flag (05-VISUAL-DESIGN-SPEC §11: the eyebrow, the verdict hero
block's eyebrow, the pan captions, the counts line, the "Not leaning"
tray, the ledger's lane-state words, the per-member impact words and
the steady sentence).

**Basis:** the owner's gold balance consolidation program
(`docs/specs/gold-balance-consolidation/` — 05-VISUAL-DESIGN-SPEC §11 +
the owner's approved reference prototype `reference/balance-reference.html`
whose fa column is the draft source; the session plan GB-S4). Nothing
user-visible changes without the flag: the default view keeps today's
copy byte-for-byte (pinned by the legacy-markup snapshot test in
`apps/web/src/components/insights/signals/gold-balance-lanes.test.tsx`).

## Terminology decisions

| Concept | Persian | Rationale |
| --- | --- | --- |
| The eyebrow | طلا، شرایط امروز | 05 §4.1's "Gold, today's conditions"; the reference's fa draft used the middot form «طلا · شرایط امروز» — this round prefers the Persian comma «،» (the site's own eyebrow punctuation family); no letter-spacing/tracking in fa per 05 §4.1. |
| Today's lean (the verdict eyebrow) | گرایش امروز | The reference's fa draft, kept: «گرایش» is the balance's established lean word (round-76's subtitle «گرایش امروز» — the same phrase the hero block now wears). |
| Supporting gold / Pressuring gold (the pan captions) | به نفع قیمت طلا / علیه قیمت طلا | Identical to round-76's member-group words (memberSupports/memberPressures): the pan caption and the member rows speak ONE vocabulary pair («به نفع / علیه»), so the pan and its contents read as one system. |
| {n} for · {n} against | {n} موافق · {n} مخالف | The counts line adopts round-76's «موافق / مخالف» pair (laneSplit's words) — the counts, the split line and the ledger all count the same way. |
| {n} not leaning | {n} بدون گرایش | Matches the tray title «بدون گرایش» (below): the count names the tray's own state — a reader who meets the word twice (counts + tray) spends no effort mapping them. |
| {n} unread | {n} ناخوانده | New short counting word. The site's longer state phrase «قابل ارزیابی نبود» stays on the ledger row; inside the compact counts line the noun «ناخوانده» keeps the line scannable — recorded as a deliberate register split (count vs statement), the reference's own fa column («{u} ناخوانده») is the source. |
| Not leaning (the tray title) | بدون گرایش | The reference's fa draft, kept — and the tray note states the honest reason: «سنجیده شد، اما گرایش روشنی نیست» (weighed, but no clear lean). The OLD tray titles «خنثی» / «قابل ارزیابی نیست» remain on the DEFAULT view untouched. |
| Every driver is on a pan. (the empty tray) | همهٔ عوامل روی کفه‌ها هستند. | The reference's fa draft, kept: «کفه» is the balance's own pan word — plain, physical, honest when the tray is empty. |
| Leans for gold / Leans against gold | به نفع طلاست / علیه طلاست | The ledger's state words: the valence pair + the copula «است» states a present condition (not a forecast), matching OI-1's conditions-voice direction without touching the Outlook sentences (GB-S5's job). |
| Not leaning (a lane's state) | بدون گرایش | Same word as the tray title: the state names where the lane sits. |
| Couldn't be read (a lane's state) | قابل ارزیابی نبود | Round-76's established unread family («قابل ارزیابی») in the past-tense statement form — consistent with membersUnreadTitle. |
| Split: {supports} for, {pressures} against | دوپاره: {supports} موافق، {pressures} مخالف | OI-2's badge word «دوپاره» (round-76) now leads the ledger row's state line, followed by the same «موافق، مخالف» counts — the badge, the tally and the row all say the same contest. |
| Supports / Pressures / Unread (the member words) | به نفع / علیه / ناخوانده | The ledger's per-member end-side words: the short valence pair (no «قیمت طلا» suffix — the row already says the lane and the side), and «ناخوانده» matches the counts line's noun. |
| Not firing ({n}): {names} | غیرفعال ({n}): {names} | The steady sentence: round-76's «غیرفعال» title grows a name list — the steady voters stay reachable (AC-2) in ONE muted sentence, comma-joined «، » in fa. |
| Latin tokens kept Latin | (none new) | No new tickers; the dynamic numbers render through the fa locale formatter (Persian digits). |
| The fa list separator «، » | ،  (BalanceScale.tsx) | The steady sentence's name list joins with the U+060C Arabic comma + space in fa (vs `', '` in EN) — the same technical-punctuation class as the round-52 «٪» percent glyph: a locale separator, not copy; triaged in the manifest alongside this round's keys. |

## Process record

1. Copy authored in `insights-copy-en.ts` + `insights-copy-fa.ts`
   (shape type-checked against `InsightsCopy`; both dictionaries gain
   the same 19 keys; every key renders only under the flag).
2. `pnpm copy:audit` flagged the 19 fa strings as NEW.
3. Reviewed against `persian-terminology.md` + the round-50/53/76 gold
   decisions (the balance's «ترازو / گرایش / به نفع / علیه / موافق /
   مخالف / دوپاره / غیرفعال / قابل ارزیابی» families all reuse their
   established words; the two new nouns are «کفه» — the physical pan,
   from the reference's approved fa draft — and the counts-line word
   «ناخوانده»). No em dashes anywhere in the new fa strings (pinned by
   the dictionary-coverage test).
4. Checked in the real UI context: the jsdom component suite renders
   the fa visual (Persian digits in the counts/tallies, RTL mirroring,
   the split badge, the Persian state words — asserted in
   `gold-balance-lanes.test.tsx`), and the browser screenshot set
   (EN + fa, 360 + 1280, light + dark — evidence/gb-s4/) verifies the
   rendered page in context.
5. Manifest updated via `pnpm copy:audit:update` — all 19 strings
   `processed`, round `round-77`, reference this document.
6. `pnpm copy:audit` exits 0 before the push.

## What this round deliberately does NOT touch

- The balance's LEGACY keys (`subtitle`, `trayNeutral`, `trayUnread`,
  the captions, the counts words) — the default view is byte-stable
  until the owner-gated P5/GB-S6 flip.
- The `signals.goldScore` dictionary — frozen until OI-3 clears.
- The Outlook sentences (OI-1) — GB-S5 asks the owner; nothing moves here.
- The round-76 lane-view keys (tallies, badge, aria pattern, context
  line, measured note) — reused as they are; only their PRESENTATION
  changed this session.
