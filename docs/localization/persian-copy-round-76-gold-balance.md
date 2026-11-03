# Persian copy round 76 — the consolidated gold balance's lane view (GB-S3 / P2)

**Date:** 2026-11-03 · **Scope:** 17 flagged fa strings in
`apps/web/src/i18n/insights-copy-fa.ts` — the consolidated gold balance's
lane-view copy under `signals.balance` (13 top-level keys + the four
`laneIntro.*` sentences), rendered ONLY behind the `?balance=lanes`
preview flag on the Insights page (the merged gold card's balance block:
the reworded subtitle, the lane chips' tallies, the "Split" badge, the
detail panel's member groups, the context line, the measured note).

**Basis:** the owner's gold balance consolidation program
(`docs/specs/gold-balance-consolidation/` — 03-UX-AND-COPY §6's FA
drafts, this round's review; the session plan GB-S3). The reworded
subtitle states the four-lane model in plain words; the measured note
carries the LANE model's own measured record
(`docs/insights/BACKTEST-GOLD-LANES.md`: sign-agreements 51.9 / 46.6 /
41.1% at 5/20/60 trading days — no positive association — and
against-readings preceding larger rises at 20td/60td), which is also
where the link points. Nothing user-visible changes without the flag:
the default view keeps today's copy byte-for-byte (pinned by the
legacy-markup snapshot test in
`apps/web/src/components/insights/signals/gold-balance-lanes.test.tsx`).

## Terminology decisions

| Concept | Persian | Rationale |
| --- | --- | --- |
| The reworded subtitle | چهار عامل اصلی مؤثر بر طلا … ترازو گرایش امروز را نشان می‌دهد و پیش‌بینی نیست. | 03 §6.1's draft, kept: «ترازو» names the instrument (the balance's own word since round-50), the honesty rule «پیش‌بینی نیست» rides the subtitle itself (01 §8.1). |
| {firing} of {readable} drivers firing | {firing} مورد از {readable} عامل فعال است | Mirrors the site's existing count grammar (round-53's «{firing} مورد از {total} عامل فعال است»); «عامل» is the panel's established word for a driver. |
| No driver firing | هیچ عاملی فعال نیست | Round-53's own «موردی فعال نیست» family, singular-negative form for a lane. |
| {supports} for, {pressures} against | {supports} موافق، {pressures} مخالف | «موافق/مخالف» — for/against in plain Persian; deliberately NOT «باد موافق/باد مخالف» (the wind vocabulary is banned from the consolidated card, 01 §8.3). |
| Split (OI-2's badge) | دوپاره | OI-2's proposed default; «دوپاره» (split in two) says "contested", not "empty" — a two-word disclosure beside the counts. |
| The chip's aria pattern | {lane}: {side}. {tally}. | Placeholders kept intact; the side word comes from the card's existing `conditionStateShort` vocabulary (no new words). |
| Supports gold / Pressures gold | به نفع قیمت طلا / علیه قیمت طلا | The lane member groups; reuses the site's valence pair «به نفع / علیه» (round-53's impact words minus the wind metaphor). |
| Not firing ({n}) | غیرفعال ({n}) | «غیرفعال» matches the panel's «عامل فعال» family — the steady voters are honestly inactive, not absent. |
| Could not be read ({n}) | قابل ارزیابی نبود ({n}) | Polished from 03 §6.2's draft «قابل‌خواندن نبود» to the site's established «قابل ارزیابی» family (the tray word «قابل ارزیابی نیست», round-50) — one state language. |
| Open indicator (the deep link) | نمایش کارت شاخص | «نمایش» (show) reads as a link action; «کارت شاخص» is the site's own noun for the indicator cards. |
| The context line | طلا در ۳۰ روز گذشته: {change}. برای زمینه نشان داده می‌شود و در ترازو حساب نمی‌شود. | 03 §6.2's draft, kept: «زمینه» = context (the site's existing context-word family), «حساب نمی‌شود» states the non-voting rule plainly; Persian digits in static copy. |
| The measured note | در مقایسه با حرکت واقعی طلا … این ترازو شرایط را توصیف می‌کند، نه جهت را. | 03 §6.2's draft, kept: the sentence states the lane model's own measured record; «خوانش‌های مخالف طلا» (readings against gold) carries the reverse-association finding WITHOUT the banned wind word «باد مخالف» — the round-55 note said «برچسب باد مخالف», this one says it wind-free because the consolidated card must be (01 §8.3). |
| The laneIntro sentences | هزینهٔ استقراض دلار: … / دلار آمریکا در برابر ارزهای اصلی و ین ژاپن. / تنش در بازارهای مالی، از بازار پول تا نوسان‌ها. / تورم و انتظارات تورمی در آمریکا و اروپا. | New sentences (03 §3 item 1: what each lane measures, ≤12 words, descriptive only); the lane names reuse round-53's «هزینهٔ استقراض / دلار / تنش بازار / تورم» (`laneNames`), the sentences add only plain descriptive words. |
| Latin tokens kept Latin | (none new) | No new tickers; the years and horizons are Persian digits. |

## Process record

1. Copy authored in `insights-copy-en.ts` + `insights-copy-fa.ts`
   (shape type-checked against `InsightsCopy`; both dictionaries gain
   the same 17 keys; the reworded subtitle lands as the SIBLING key
   `subtitleLanes` because the shared `subtitle` still renders the
   default view, which stays byte-for-byte today's until the owner's
   P5/GB-S6 flip — then the two keys merge).
2. `pnpm copy:audit` flagged the 17 fa strings as NEW.
3. Reviewed against `persian-terminology.md` + the round-50/53/55
   gold-panel decisions (the lane/voter/evidence/tilt dictionaries
   under `signals.goldScore` are reused untouched, so their
   fingerprints do not churn). One polish beyond the drafts: the
   unread-group title moved to the «قابل ارزیابی» family (recorded
   above). No em dashes anywhere in the new fa strings (pinned by
   the dictionary-coverage test).
4. Checked in the real UI context: the jsdom component suite renders
   the fa lane view (Persian digits in the tallies, RTL mirroring, the
   split badge) and the browser screenshots (EN + fa, 360 + 1280)
   verify the rendered page in context.
5. Manifest updated via `pnpm copy:audit:update` — all 17 strings
   `processed`, round `round-76`, reference this document.
6. `pnpm copy:audit` exits 0 before the push.

## What this round deliberately does NOT touch

- The `signals.goldScore` dictionary (the wind panel's copy) — the
  panel still renders in the DEFAULT view until P5/GB-S6; its keys and
  fingerprints are frozen.
- The Outlook sentences (OI-1) — the owner decides; the rewording rides
  GB-S5 (P4).
- The balance's legacy keys (`subtitle` and friends) — the default view
  is byte-stable until the flip.
