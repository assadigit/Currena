# COPY-1 — GF-S9 gold-meter i18n copy (EN + FA) for 7 new indicators

**Agent:** Z.ai Code (Claude)
**Session:** GF-S9 gold-meter gap-fill
**Task ID:** COPY-1
**Date:** 2026-11-06 (repo clock)

## What was done

Added EN + FA (Persian) `IndicatorCopyEntry` copy for the 7 new `IndicatorId`
enum members added to `packages/core/src/schemas.ts` (lines 644–650) in a
prior task. The web's `Record<IndicatorId, IndicatorCopyEntry>` typed dicts
(`INDICATORS` const in EN; inline `indicators:` object in FA) required entries
for all 7 or `tsc --noEmit` failed with `TS2740`.

### The 7 ids and their card roles

| id | role | lane / polarity | modelled on |
| --- | --- | --- | --- |
| `real-yield-5y` | VOTER | borrowing-costs / −1 | `real-yield-10y` |
| `dollar-broad` | VOTER | dollar / −1 | `dollar-basket` |
| `dollar-eme` | VOTER | dollar / −1 | `dollar-basket` (EME twin) |
| `bank-stress` | VOTER | stress / +1 | `nfci` / `stress-stlfsi` |
| `wgc-etf-holdings` | CONTEXT | info, never votes | `usdchf` / `eur-usd` context style |
| `wgc-cb-demand` | CONTEXT | info, never votes | same |
| `official-gold-demand` | CONTEXT | info, never votes | same |

## Files edited (only these two, per task constraint)

1. `apps/web/src/i18n/insights-copy-en.ts` — GF-P3 block at **lines 3314–3467**
   - comment header 3314–3317
   - 7 entries 3318–3467 (inserted right after `usdchf:` closing `},` at 3313,
     before the `M6 Wave 3` comment now at 3468)
2. `apps/web/src/i18n/insights-copy-fa.ts` — GF-P3 block at **lines 3377–3530**
   - comment header 3377–3380 (Persian, Persian-digit date ۲۰۲۶-۱۱-۰۶)
   - 7 entries 3381–3530 (inserted right after `usdchf:` closing `},` at 3376,
     before the `M6 Wave 3` comment now at 3531)

No other files were modified. `definitions.ts`, `schemas.ts`, `display.ts`
were already done by a prior task and left untouched.

## Copy shape (all 11 fields per entry, both languages)

`name`, `oneLiner`, `lines { highRising, highEasing, typical, low }`,
`whatItIs`, `whyItMatters`, `tendedToMean`, `cantTell`, `forYou`.

`ticker` omitted on all 7 (matches the model entries `real-yield-10y`,
`dollar-basket`, `nfci`, `stress-stlfsi` which carry no ticker; the ticker
field's own doc says "never source codes", so FRED series ids stay in
`whatItIs` text only, e.g. "FRED's DFII5" / "DFII5 در FRED").

## D-GF-3 no-forecasting discipline (applied throughout)

- Hedged language only: "usually", "tends to", "the setting where",
  "has historically been". No "will", "means gold…", "signals that gold…".
- Voter cards describe CONDITIONS (the mechanism: "tightens conditions for
  borrowers", "tends to pressure commodity prices"), never price outcomes.
- `bank-stress` (polarity +1) copy never mentions gold — it describes funding
  stress only, matching the `nfci`/`stress-stlfsi` precedent (the polarity is
  applied in `definitions.ts`, not in user copy).
- Context cards (`wgc-*`, `official-*`) explicitly disclaim price direction in
  `cantTell` ("Tonnes held say nothing about price direction", "voting in no
  gauge") and `forYou` ("whatever the price does", "not necessarily the demand").

## FA conventions followed (`persian-terminology.md` + `persian-copy-workflow.md`)

- **No em dashes** in user-facing Persian; used `،` / `؛` / `:` / `(...)`.
- **Persian digits** everywhere in static copy (۲۶، ۲۰۲۲، ۲۰۲۳، ۲۰۲۵، ۲۰۲۶،
  ۵، ۱۰، ۳۰، ۲۰۰۸، ۲۰۲۰، ۲۰۱۰، ۴۰۰، ۵۰۰، ۳).
- **Latin tickers / FRED codes stay Latin**: DFII5, DTWEXBGS, DTWEXEMEGS,
  DPCREDIT, FRED, ETF, WGC, PBoC, SAFE, CBR, DXY.
- **ZWNJ** where meaningful: بانک‌های مرکزی, صندوق‌های, نگهداری‌شده,
  قیمت‌های, تأمین مالی, کوتاه‌مدت, سه‌ماهه, ماهانه, etc.
- **Terminology glossary respected**: طلا, بازده واقعی, فدرال رزرو,
  بانک مرکزی / بانک‌های مرکزی, شاخص دلار, اوراق خزانه‌داری, تنش, تقاضا.
- **ETF term**: "صندوق‌های قابل معامله" in `name`/`whatItIs` (matches the
  existing FA usage at line 4212), "ETF" as the short tag inside `lines`
  (globally recognised abbreviation, consistent with EN's lines using "ETF").
- Voice calibrated against the existing FA `real-yield-10y` (2808),
  `dollar-basket` (3226), `nfci` (3165), `usdchf` (3355) entries — natural
  Persian, not literal translation.

## Verification

### Typecheck (PRIMARY success criterion)

```
cd /home/z/my-project/Currena && pnpm --filter @currena/web run typecheck
> tsc --noEmit
TYPECHECK_EXIT=0   ← 0 errors (was 2 × TS2740 before)
```

The 2 pre-edit errors (EN line 2672, FA line 2765, both `TS2740 missing
properties: real-yield-5y, dollar-broad, dollar-eme, bank-stress, and 3 more`)
are now resolved. No other typecheck errors exist in the web package.

### Persian copy audit (`pnpm copy:audit`)

```
NEW — untriaged Persian strings (77):
  [all 77 are the new indicators.{id}.{field} keys from my 7 FA entries × 11 fields]
QUEUED — review debt (does not fail the audit) (116):   ← pre-existing, untouched
DIVERGENT — same English, different Persian (advisory) (8):  ← pre-existing
✗ 77 finding(s) need attention
```

- **0 CHANGED, 0 REMOVED, 0 MISSING-TRANS, 0 MIRROR-DRIFT, 0 MANIFEST-ERROR**
  → my edits introduced no quality findings; en↔fa key parity is perfect
  (the MISSING-TRANS check confirms every new EN key has an FA counterpart
  and vice versa, all 77 fields paired).
- The 77 NEW findings are the **expected, documented** state for genuinely new
  fa copy: per `persian-copy-workflow.md` §3, new strings always appear as
  NEW until triaged into the manifest via `pnpm copy:audit:update`
  (`--status processed --round … --reference …`). That step edits
  `docs/localization/persian-copy-manifest.json`, which this task explicitly
  forbids ("Do NOT modify any files other than the two i18n copy files").
  The manifest triage is a separate review step for the human reviewer / a
  follow-up task that owns the manifest.

### EN oneLiners (3-line tone summary for verification)

1. `real-yield-5y` — "What 5-year US government bonds pay after inflation:
   the "real" return at the belly of the curve, where policy bites first."
2. `dollar-broad` — "The Fed's broad trade-weighted dollar index: the
   dollar's average value against 26 trading partners, "the honest inverse"
   of gold."
3. `dollar-eme` — "The Fed's emerging-market dollar index: the dollar's
   value against the currencies of the marginal gold buyer."
4. `bank-stress` — "The 30-day commercial paper rate: what top US companies
   pay for very short cash, the modern bank-run tell."
5. `wgc-etf-holdings` — "How much gold the world's gold-backed ETFs hold, in
   tonnes: a read on the Western investor bid."
6. `wgc-cb-demand` — "How much gold central banks bought, in tonnes: the
   2022–2026 regime driver for the gold market."
7. `official-gold-demand` — "Monthly official-sector gold purchases, in
   tonnes: the monthly twin of the WGC quarterly read."

## Notes for the next agent

- The 77 NEW audit findings need manifest triage (`pnpm copy:audit:update`)
  once a reviewer approves the wording — that is the ONLY remaining step
  before `pnpm copy:audit` exits 0. The round/reference to cite is
  `round-80` (or the next free round number) with this work-record file as
  the reference.
- If the reviewer wants copy tweaks, edit the two i18n files only; re-run
  `pnpm --filter @currena/web run typecheck` (must stay 0) and
  `pnpm copy:audit` (NEW count must stay 77, no new CHANGED/MISSING-TRANS).
- The FRED series codes (DFII5, DTWEXBGS, DTWEXEMEGS, DPCREDIT) appear in
  `whatItIs` only, never in `ticker` (ticker rule: "never source codes").
- The 3 context cards' `lines` are deliberately state-descriptive ("ETF
  holdings are building", "Central-bank purchases are running above their
  decade norm") with no voting-pressure language, per the task's "no voting
  lines pressure" instruction for context cards.
