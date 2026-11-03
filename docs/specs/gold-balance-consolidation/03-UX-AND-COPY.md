# 03. UX and copy

## 1. Anatomy of the gold card after the change

Top to bottom, inside the merged gold card (`signals/MergedCard.tsx`):

1. **Outlook strip** (`VerdictStrip`): unchanged layout. The gold state now
   comes from the balance (01 §5.2). Silver unchanged.
2. **Balance** (`BalanceScale`), with these changes:
   - Heading unchanged: "The aggregate of factors affecting the price of gold".
   - Subtitle reworded (below).
   - Two side captions over the two pans (unchanged).
   - Stage, beam, needle, pans (unchanged geometry and animation).
   - **Pan items are lane chips** (up to 4 in total, so the pans are light).
   - Aggregate box (verdict word, counts line, readable line): unchanged
     structure; the counts count lanes.
   - **New: context line** (gold's 30-day move, not counted).
   - **New: the measured note + backtest link**, moved here from the wind panel.
   - Neutral tray and unread tray: lane chips.
   - C12 banner (gold near decade high while real yields are high): unchanged.
3. **Price footing strip**: unchanged.

**Removed:** the `data-gold-panels` two column grid, the entire
`GoldTailwindPanel` ("Gold tailwind score", wind icon, net score number,
"Headwind" word, lane list, firing drivers list), and the entire
`ModelVsRealityPanel`. Nothing about gold is shown outside the balance.

No internal link or test outside the panel's own tests references
`#insights-gold-tailwind`, so no anchor alias is added.

## 2. The lane chip

A lane chip is the existing compact balance chip (`data-balance-tile` /
`data-balance-chip`) with two lines:

```
[icon]  Borrowing costs
        3 of 8 drivers firing
```

- Icon: the lane's own icon (borrowing costs, dollar, market stress,
  inflation). New icons follow the `components/icons/currena` pattern. If
  assets are not ready, reuse the `ConditionIcon` set already used by the
  balance chips (real yield, expectations, stress, dollar map to the four lanes).
- Second line: `{firing} of {readable} drivers firing`. When `firing = 0` and
  `readable > 0`: "No driver firing". Numbers formatted for the locale.
- Placement: lane `for` on the supporting pan, `against` on the pressuring pan.
  `neutral` in the Neutral tray. `unread` in the "Couldn't read" tray.
- Split lane (`neutral` with `split = true`): sits in the Neutral tray with a
  small badge "Split" and the second line becomes `2 for, 2 against`. This is
  the single most important disclosure: it shows that a neutral lane is
  contested and not empty.
- A lane with fewer than the minimum firing voters sits in the Neutral tray
  with the plain second line ("1 of 5 drivers firing"). No badge.

States are never colour-only: the pan, the tray name and the badge text carry
the meaning.

## 3. Interaction: the detail panel

Tapping or pressing Enter/Space on a lane chip opens the balance's existing
shared detail panel (same pattern as today, every width). Contents:

1. Lane name and one sentence: what the lane measures (reuse the lane
   explanation text if present, otherwise the new `laneIntro` keys).
2. **Members that fire**, grouped "Supports gold" and "Pressures gold". Each
   row: voter name (existing `voterNames`), evidence phrase (existing
   `evidenceWords`: rising, falling, high in its decade, low in its decade),
   current value text (`valueText`, same helper as today's chips).
3. **Not firing (n)**: collapsed by default; lists the steady voters by name.
4. **Could not be read (n)**: only if any.
5. Inflation lane only: the existing inflation-tilt phrase (building, fading,
   steady) as a context line. The `breakeven-5y5y` row shows the indicator
   card's own status word beside its lean phrase (the B-12 rule, 02 §4.2).
6. A link "Open indicator" per row to the indicator card (existing deep link
   pattern `/insights?card=<id>`), where the indicator already has one.

`BalanceDriver` (in `BalanceScale.tsx`) gains one optional field:

```ts
members?: ReadonlyArray<{
  key: string;
  label: string;
  impact: 'supports' | 'pressures' | 'steady' | 'unread';
  evidenceText: string | null;
  valueText: string | null;
}>;
split?: boolean;
tally?: string;        // the chip's second line, built by the caller from copy
```

The component stays reusable by contract: it knows nothing about gold beyond
copy strings. The merged card builds lane drivers from `goldBalance()`.

## 4. States

| State | Behaviour |
|---|---|
| All 4 lanes unread | Level beam, verdict "Can't read the conditions right now", both pans carry the existing `listEmptyNone` sentence. Context line may still show. |
| Fewer than 3 readable lanes | Level beam plus the existing not-enough line (UI-40). |
| Net 0 | Level beam, "Balanced". |
| Net not 0 | Beam tips by the existing formula, verdict "Leaning for / against gold". |
| Empty pan | Existing `listEmptyFor` / `listEmptyAgainst` sentence inside the pan. |
| Context value missing | Context line hidden. |

The 2026-10-31 reading (01 §7) renders: level beam, "Balanced", counts
"0 for, 0 against, 4 neutral", Borrowing costs chip in the Neutral tray with
the "Split" badge and "2 for, 2 against".

## 5. Accessibility, RTL, responsive

- Each chip is a button with `aria-label`: `{lane}: {side}. {firing} of {readable} drivers firing.` (`laneChipAria`). Split lanes append "Split, {supports} for, {pressures} against".
- The beam drawing stays one `role="img"` with `gaugeAria` (unchanged mechanism).
- Focus order: pan chips, trays, then the detail panel. Focus returns to the
  chip on close. Visible focus ring (existing `focus-visible` classes).
- Touch targets at least 44px (the existing chip rule).
- RTL: logical properties only (`ms-/me-/ps-/pe-`). Numbers use the locale
  formatter. The Persian rendering of "Split" and tallies must not use em
  dashes.
- 360px and 1280px: no horizontal overflow, no clipped chips. With at most 4
  chips the pan height shrinks versus today's pans; verify the reserved stage
  height still matches (it reserves the taller stack plus the swing).
- `prefers-reduced-motion`: existing behaviour (beam jumps to angle).
- Dark mode: no new colours; reuse existing tokens.

## 6. Copy

All strings go through the i18n dictionaries (`insights-copy-en.ts`,
`insights-copy-fa.ts`). **FA below are drafts and must go through the
Persian copy review round (`docs/localization/persian-copy-workflow.md`)
before the preview flag is flipped.** No em dashes in fa copy.

### 6.1 Changed

| Key (under `signals.balance`) | EN (proposed) | FA (draft) |
|---|---|---|
| `subtitle` | "Gold's four main drivers are each read against their usual range and weighed equally. The beam shows today's lean. It is not a forecast." | «چهار عامل اصلی مؤثر بر طلا هرکدام در برابر محدودهٔ معمولشان خوانده و با وزن برابر سنجیده می‌شوند. ترازو گرایش امروز را نشان می‌دهد و پیش‌بینی نیست.» |

### 6.2 New

| Key | EN | FA (draft) |
|---|---|---|
| `laneTally` | "{firing} of {readable} drivers firing" | «{firing} مورد از {readable} عامل فعال است» |
| `laneTallyNone` | "No driver firing" | «هیچ عاملی فعال نیست» |
| `laneSplit` | "{supports} for, {pressures} against" | «{supports} موافق، {pressures} مخالف» |
| `splitBadge` (OI-2) | "Split" | «دوپاره» |
| `laneChipAria` | "{lane}: {side}. {tally}." | «{lane}: {side}. {tally}.» |
| `memberSupports` | "Supports gold" | «به نفع قیمت طلا» |
| `memberPressures` | "Pressures gold" | «علیه قیمت طلا» |
| `membersSteadyTitle` | "Not firing ({n})" | «غیرفعال ({n})» |
| `membersUnreadTitle` | "Could not be read ({n})" | «قابل‌خواندن نبود ({n})» |
| `contextLine` | "Gold over the last 30 days: {change}. Shown for context, not counted in the balance." | «طلا در ۳۰ روز گذشته: {change}. برای زمینه نشان داده می‌شود و در ترازو حساب نمی‌شود.» |
| `measuredNote` | "Measured against gold's actual moves over 2016 to 2026: the lean of these drivers showed no positive association with the next 5 to 60 days. If anything, readings against gold came before larger rises. It describes conditions, not direction." | «در مقایسه با حرکت واقعی طلا در سال‌های ۲۰۱۶ تا ۲۰۲۶، گرایش این عوامل رابطهٔ مثبتی با ۵ تا ۶۰ روز بعد نشان نداد؛ اگر چیزی بود، خوانش‌های مخالف طلا پیش از رشدهای بزرگ‌تر آمدند. این ترازو شرایط را توصیف می‌کند، نه جهت را.» |
| `laneIntro.*` | One sentence per lane (borrowing costs, dollar, market stress, inflation), 12 words or fewer, descriptive | to draft in the review round |

The `measuredNote` text describes the frozen 21-voter table's measured
result (BACKTEST-GOLD). The lane model is a new table, so the calibration
report (02 §6, `BACKTEST-GOLD-LANES.md`) must confirm the same sentence is
true for it. If the lane report shows a different association, reword the
note to the lane report's own conclusion and point the link at that report.
The note never claims an edge.

`measuredNoteLink` ("Read the full backtest") and the lane, voter, evidence
and tilt word dictionaries under `signals.goldScore` are **reused as they
are**. Keeping their key paths means their copy-audit fingerprints do not
churn.

### 6.3 Outlook sentences (OI-1, owner decides)

Gold only. The seven states, their order and the short state names stay.
Proposed gold sentences (silver keys untouched):

| State | Current EN | Proposed EN |
|---|---|---|
| strong-bullish | Signs point to a potential significant rise in gold prices. | Conditions strongly favour gold prices. |
| bullish | Signs point to a potential rise in gold prices. | Conditions lean in favour of gold prices. |
| neutral | Signs point to a neutral outlook for gold prices. | Conditions are neutral for gold prices. |
| range-bound | Signs point to gold prices trading within a defined range. | Gold prices are trading within a defined range. |
| bearish | Signs point to a potential decline in gold prices. | Conditions lean against gold prices. |
| strong-bearish | Signs point to a potential significant decline in gold prices. | Conditions strongly lean against gold prices. |
| mixed | Market signals for gold prices are mixed. | Conditions for gold prices are mixed. |

FA drafts for the changed states (review round): bullish «شرایط فعلی به نفع قیمت طلاست.»,
bearish «شرایط فعلی علیه قیمت طلاست.», strong variants prefix «به‌شدت»,
neutral «شرایط برای قیمت طلا خنثی است.», mixed «شرایط برای قیمت طلا ترکیبی است.»,
range-bound «قیمت طلا در محدوده‌ای مشخص معامله می‌شود.»

If the owner declines OI-1, the existing sentences stay and the engine
change still ships; the report must then note that the sentence wording
still reads as a forecast.

### 6.4 Retired (removal deferred to OI-3, separate PR)

Under `signals.goldScore`: `title`, `subtitle`, `labels`, `noReadWord`,
`netFiringLine`, `netFiringNone`, `laneCountsLabel`, `laneCountsLine`,
`subGaugeWords`, `impactWords`, `votersTitle`, `votersNone`, `footnote`,
`measuredNote` (replaced by `balance.measuredNote`). All of
`signals.goldModelVsReality`. They stay in the dictionaries, unused, until
OI-3 clears, so the manifest and the frozen engine's tests are not disturbed.

## 7. Visual QA checklist (for the PR)

- EN and FA, light and dark, 360px and 1280px: screenshots of the level
  case, a one-sided case, a split lane, an all-unread case, and the Outlook
  strip beside each.
- Beam angle for net -1, -2, -3 matches the existing formula.
- No occurrence of "tailwind", "headwind", "wind" in the rendered gold card
  (DOM text scan, both locales).
- Keyboard-only run: open each chip, close, focus restored.
