# Layer 1 — Decisions log

Every ambiguity the spec left open is recorded here as: assumption + reason +
the conservative option chosen. The owner/style-guide rule order is:
**already-approved site wording > style guide > this log's conservative choice**.

## D-01 — Where the Layer 1 copy lives

**Assumption.** The spec (§5) says "One typed content source keyed by the
indicator's existing stable id (follow the repo's language and conventions:
TS modules or JSON, agent's choice)."

**Decision.** Add a new top-level `layer1` object to the EXISTING
`apps/web/src/i18n/insights-copy-en.ts` and `insights-copy-fa.ts` dictionaries
(en source of truth, fa shape-checked at compile time — the repo's established
pattern). Shape:

```ts
layer1: {
  ui: { whatItIs, whyItMatters, ifRising, ifFalling, connections, australiaAngle, plainWords, noDirection },
  indicators: { [id]: Layer1Entry },   // only the NEW Layer-1 fields
  glossary:   { [termId]: GlossaryEntry },
}
```

**Reason.** (a) Zero audit-infrastructure change — the Persian-copy audit
already extracts the fa dictionary by walking the exported object literal, so
every fa string gets a stable manifest id like `layer1.indicators.<id>.oneLine`
and is triaged the documented way (`pnpm copy:audit` + `pnpm copy:audit:update`).
A separate TS file would be swept as "hardcoded Persian literals" with fragile
sha-derived ids, complicating the manifest by the hundreds. (b) Shape-checked:
fa missing a key fails typecheck (the repo's existing guarantee). (c) Loads
lazily with the `/insights` route chunk (the existing bundle-budget discipline
applies — bump the budget consciously when measured, the documented D-16 path).
(d) The spec's "one typed content source keyed by the indicator's existing
stable id" is satisfied (the id IS the existing `IndicatorId`).

## D-02 — Reuse approved `whatItIs` / `whyItMatters`, do not re-write them

**Assumption.** Spec §4 lists `whatItIs` (≤ 35 words) and `whyItMatters`
(≤ 55 words) as required per indicator. The repo ALREADY has approved,
audit-manifested `whatItIs` / `whyItMatters` for every indicator in
`copy.indicators[id]` (some carry digits like "6 to 24 months", which the
spec's G6 would otherwise ban).

**Decision.** The Layer 1 `Layer1Entry` carries ONLY the NEW fields:
`plainName`, `oneLine`, `ifRising`, `ifFalling`, `connections`,
`australiaAngle?`, `glossaryTerms`. The accessor `getIndicatorCopy(id, lang)`
returns a MERGED object that pulls `whatItIs` / `whyItMatters` from the
existing approved `copy.indicators[id]` entry, so the consumer (and Layer 2)
gets the full spec §4 shape in one call. The validator's G2 (length), G3
(jargon), G6 (no digits) and G7 (readability) apply ONLY to the new Layer-1
fields (`plainName`, `oneLine`, `ifRising`, `ifFalling`, `connections`,
`australiaAngle`) and the glossary — NOT to the approved `whatItIs` /
`whyItMatters` (approved wording wins over the style guide; re-validating
approved copy would either force re-writing approved wording or fail).

**Reason.** "Already-approved site wording always wins over the style guide"
(spec rule). Re-writing approved copy would either duplicate it or contradict
it; both violate the rule. The new fields are where Layer 1 adds value.

## D-03 — `plainName` is written but not rendered on the collapsed card face

**Assumption.** Spec §4 says `plainName` (≤ 6 words) is "friendly label shown
beside the official name (the official name stays)." Spec §6 (display) lists
what to show on the collapsed card (`oneLine`) and in the expanded view
(`whatItIs`, `whyItMatters`, `ifRising`, `ifFalling`, `connections`,
`australiaAngle`, glossary) — but does NOT mention `plainName` anywhere in the
display section.

**Decision.** Write `plainName` for every indicator (it is a required field and
Layer 2 needs it). Render it minimally ONLY in the expanded DetailsPanel header,
as a small muted line beside the existing `name` + `ticker` (the "official
name" pair). Do NOT render it on the collapsed card face (§6 does not list it
there, and adding it would enlarge the card, which §6 forbids).

**Reason.** Conservative reading of §6 ("Card (collapsed): show `oneLine` …
Keep the card's existing hierarchy; do not enlarge cards"). `plainName` still
ships (required by §4, needed by Layer 2) and has a small, spec-consistent
display spot in the expanded panel.

## D-04 — `oneLine` on the collapsed card: a new tiny muted line, below the existing meaning line

**Assumption.** §6 says collapsed card shows `oneLine` as "small, muted text
under the value/label … Keep the card's existing hierarchy; do not enlarge
cards." The `AlertCard` already has a state-keyed meaning line (the
`consequenceLine`) — `oneLine` is ALWAYS-TRUE/state-independent, so it is a
different sentence.

**Decision.** Add `oneLine` as a new, single, caption-sized, muted (`color-text-
tertiary`) line at the bottom of the card face (after the existing meta + extra
lines, before the details control). It renders ONLY when a Layer-1 entry exists
for the id (graceful during the batch roll-out). It is NOT a replacement for the
existing consequence line.

**Reason.** §6 explicitly requires `oneLine` on the collapsed card. Putting it
at caption size + muted + at the bottom keeps the card's hierarchy (title →
value → change → chip → meaning → meta → details) intact and is the smallest
addition that still honours "do not enlarge cards."

## D-05 — Expanded DetailsPanel: a NEW grouped block, no reordering of existing sections

**Assumption.** §6 says the expanded view adds, in order: `whatItIs`,
`whyItMatters`, `ifRising`, `ifFalling`, `connections`, `australiaAngle`,
glossary. The existing DetailsPanel shows (F5 order): `forYou`, `whyItMatters`,
`tendedToMean`, `cantTell`, `whatItIs` — approved wording and order.

**Decision.** ADD a new grouped block titled with the Layer-1 ui label
(`plainWords` / «معنی واژه‌ها») containing, in the spec's order: `ifRising`,
`ifFalling`, `connections`, `australiaAngle` (if present), glossary term list.
`whatItIs` and `whyItMatters` are NOT re-added (they are already shown from
the approved copy, per D-02). The new block is placed AFTER the existing
`whatItIs` section and BEFORE the chart. Existing section order is untouched.

**Reason.** "Do not change the visual design system" + "approved wording wins."
Reordering approved sections would change the approved UX; the spec's "in
order" applies to the new Layer-1 block's internal order, which we follow.

## D-06 — Direction emphasis in the expanded view: CSS only, no new wording

**Assumption.** §6: "If the card already knows its direction, visually emphasise
the matching ifRising/ifFalling line."

**Decision.** When the reading carries a 30-day direction (`change30d` sign) or
a position band, emphasise the matching line (`ifRising` for a rise, `ifFalling`
for a fall) by rendering it with `font-semibold` + the primary text colour,
while the other line stays muted. No new words; CSS only.

## D-07 — Validator scope (G1–G8) and exemptions

**Decision.** The validation test `apps/web/src/components/insights/layer1/
layer1.test.ts` enforces:

- **G1 Completeness.** Every indicator id in the code inventory (100 indicators
  + 16 markets + 10 FX pairs + 7 FX patterns = 134 — see INVENTORY.md) has a
  Layer-1 entry with `plainName`, `oneLine`, `ifRising`|null+skipReason,
  `ifFalling`|null+skipReason, `connections` (0–3), `glossaryTerms` in BOTH
  en and fa; AND the existing approved copy has `whatItIs` + `whyItMatters`
  for that id (the reuse check, D-02). No Layer-1 entry exists for an id that
  is no longer in the code inventory.
- **G2 Length.** New fields only: `plainName` ≤ 6 words, `oneLine` ≤ 16 words
  & 1 sentence, `ifRising`/`ifFalling` ≤ 22 words & 1 sentence (when non-null),
  glossary `plain` ≤ 2 sentences. (Approved `whatItIs`/`whyItMatters` exempt,
  D-02.)
- **G3 Jargon.** The jargon seed (style guide §6, extended here) must not appear
  in the NEW Layer-1 copy unless the term is listed in that indicator's
  `glossaryTerms`. Glossary `term`/`plain` may use the jargon word (that is
  the point of a glossary).
- **G4 Banned advice/certainty words** (style guide §5, extended) appear
  nowhere in the NEW Layer-1 copy or glossary (case-insensitive, word-boundary).
- **G5 Farsi hygiene.** fa copy uses Persian digits ۰–۹ only (no ASCII digits);
  Persian ی/ک (not Arabic ي/ك); no double spaces; no em dash (repo rule); the
  Latin allow-list (VIX S&P ASX ECB RBA USD AUD EUR JPY CNY BTC PMI + the
  market tickers) is the only Latin allowed inside fa sentences.
- **G6 No digits** in the NEW Layer-1 copy except glossary `example?` fields.
  Digits that are part of an instrument's established **tenor / proper name**
  (`10-year`, `30-year`, `2-year`, `3-month`, `5y5y`, `10y2y`, `10y3m` …) are
  NOT "invented numbers or thresholds" (spec §8) — they are the instrument's
  name, used verbatim by the existing approved copy ("the 10-year US Treasury
  note"). The validator whitelists tenor-name digit tokens (ASCII and Persian
  digits) and only flags digit sequences that remain after stripping them
  (e.g. `3%`, `$100`, `80`). Glossary `example?` fields are fully exempt.
- **G7 Readability.** EN sentences avg ≤ 20 words, max 28; FA avg ≤ 22, max 28.
- **G8 No regressions.** `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint`,
  `pnpm copy:audit`, and the bundle-budget gate still pass.

G9 (headless render) and G10 (free-tier) are reported in the final report
(session N). The validator runs as a vitest test so `pnpm -r test` enforces it
every commit.

**Strict mode (the roll-out vs. final distinction).** The full-completeness
half of G1 ("every indicator id found in code has a Layer-1 entry") would make
`pnpm -r test` RED during the batched roll-out (only some ids have copy yet),
which violates the repo's "tests green at every commit" convention. So the
validator enforces, on EVERY run: (a) every Layer-1 entry that EXISTS is valid
(G2–G7); (b) no Layer-1 entry exists for an id NOT in the code inventory
(orphan check — the future-protection). The full-completeness check (all 134
present) is advisory (console output of missing ids) UNLESS `LAYER1_STRICT=1`
is set, in which case it hard-fails. The FINAL session sets `LAYER1_STRICT=1`,
fills the last batch until green, then deploys.

## D-08 — `australiaAngle` present only for AU indicators + AUD/RBA/petrol/home-loan global ones

**Assumption.** §4: `australiaAngle` is OPTIONAL, "only when it clearly affects
people in Australia (RBA, home loans, rent, petrol, AUD)."

**Decision.** Write `australiaAngle` for: every indicator in `section: 'australia'`
(23), plus global indicators whose effect on Australian households is direct
and widely taught (US 10y, real-yield, fed-target, brent, gold-usd, dollar-
basket, audusd/audjpy/usdjpy/usdcny already-AU, rba-fed-gap, us-japan-10y-gap
carry leg). Omit `australiaAngle` for the rest (most global indicators speak to
"people"/"households" globally per §8 region honesty).

## D-09 — `ifRising`/`ifFalling` null + `skipReason` cases

**Decision.** Set `ifRising` and/or `ifFalling` to `null` with a `skipReason`
ONLY where direction is genuinely meaningless. The only known case in the
inventory is the **pattern cards** (r1_risk_mood … r7_dollar_or_euro) which
describe a *relationship* between two series, not a level that "rises" or
"falls" — for those, `ifRising`/`ifFalling` are null and `skipReason` explains
it. For ratios/spreads (gold-oil-ratio, yield-curve legs, gaps, gold-silver,
copper-gold) direction IS meaningful (a widening/narrowing has everyday
meaning) so they get real `ifRising`/`ifFalling`.

## D-10 — Glossary term id scheme

**Decision.** Glossary term ids are kebab-case English concept slugs
(`inflation`, `yield`, `real-yield`, `interest-rate`, `central-bank`,
`volatility`, `safe-haven`, `commodity`, `recession`, `stock-index`, `bond`,
`breakeven-inflation`, `yield-curve`, `policy-rate`, `bear-market`,
`correction`, `vix`, `sahm-rule`, `cape`, `trimmed-mean`, `terms-of-trade`,
`term-deposit`, `real-return-savings`, `pmi`, `dollar-index`, `liquidity`,
`momentum`, `drawdown`, `spread`, `basis-points`, `headline-vs-core`,
`hawkish`, `dovish`, `tightening`, `easing`, `risk-on`, `risk-off`,
`inflation-expectations`, `quantitative-easing`, `futures`, `benchmark`,
`equities`, `ratio`, `bear-bull-market` …). The fa `term` field carries the
Persian term Iranians know; en `term` carries the English. `plain` is ≤ 2
sentences; `example?` may contain digits (exempt from G6) and must be clearly
an example.

## D-11 — Markets (16) and FX pairs/patterns are in scope

**Assumption.** §2 scope: "every indicator on the Insights page (all sections:
global indicators, Australia indicators, prices, world stock markets,
currencies/pairs, any gauges/patterns that have their own name)."

**Decision.** The 16 world-stock indices (n225…ibov), the 10 FX pairs
(eurusd…audcny — incl. the 4 that are ALSO indicators), and the 7 FX pattern
cards (r1_risk_mood…r7_dollar_or_euro) all get Layer-1 copy. The shared
indicator ids (usdjpy, audusd, usdcny, audjpy) get ONE Layer-1 entry each
(reused whether the card renders from the indicators snapshot or the FX
board) — no duplication. Total inventory = 134 (see INVENTORY.md).

## D-12 — Commit + deploy convention for this task

**Decision.** Land on `main` (the repo's branch — git log shows every round
commits to `main`). Commit message prefix: `insights(L1): …` following the
repo's descriptive-round style. Do NOT deploy until the FINAL session when
every gate (incl. G9/G10) is green; the owner's deploy-lock check
(`docs/DEPLOY.md`) runs first. Each batch is its own commit; the CHANGELOG
gets one entry at the end of the final session.

## D-13 — Session-2 bookkeeping: inventory count reconciliation + session-1 slips

**Assumption.** INVENTORY.md's session-1 headers said "Total: 134 items",
`growth-health` (24), `au-households` (10), and the borrowing-costs table
listed 17 rows under an "(18)" header — none matching the code.

**Decision.** Reconciled against `packages/insights/src/definitions.ts`
(source of truth): 100 indicators (borrowing-costs 18 incl. the missing
`us30y` row — added with ✓ since its copy exists; dollar-strength 5;
growth-health 23; market-stress 10; prices-board 5; prices-heat 16;
au-inflation-rates 6; au-households 11; au-trade-currency 6). Totals in
INVENTORY.md corrected to **133 table rows → 129 unique Layer-1 entries**
(16 markets + 17 FX rows, with the 4 shared FX ids counted once). Progress
is reported as "unique ids written / 129" from session 2 on; the validator
console line counts the 133-entry array (with the 4 duplicates). Also fixed
a session-1 FA glossary typo («کمتر می‌خرزد» → «کمتر می‌خرد» in
`layer1.glossary.inflation.plain`), re-triaged through the copy-audit
manifest (round `layer1`, reference COPY-REVIEW.md).

**Reason.** The spec makes the inventory the single source of truth for G1;
wrong arithmetic in the doc propagates into every progress report. Counting
unique ids is the honest denominator for "copy written" (the array counts
4 shared ids twice).

## D-14 — Writing around jargon-null terms; two validator-map extensions (PMI, VIX)

**Assumption.** The G3 JARGON map (D-07) marks some terms `termId: null`
(= must be replaced with a plain word): spread, basis points, liquidity,
equities, ratio, easing, tightening, futures, momentum, correction, dollar
index, inflation expectations (EN phrase), etc. M1 cards (china-pmi, vix,
walcl, m2-us…) naturally want some of these words.

**Decision.** (a) Write around every jargon-null term with plain wording
(e.g. "how easily money moves" instead of liquidity; "the dollar measured
against a group of currencies" instead of dollar index; no "increasing" in
EN copy — it contains the substring "easing"). (b) The two terms that are
genuinely unavoidable because they ARE the instrument's name — PMI (the
china-pmi card) and VIX (the vix card) — get glossary entries (`pmi`,
`vix`) and their JARGON-map rows now point at them (`termId: 'pmi'`,
`termId: 'vix'`), the style-guide-sanctioned "explain it or list it" path.
(c) `carry trade` is added to the JARGON map pointing at a new
`carry-trade` glossary entry (the approved site copy already uses
«کری ترید»; the validator now enforces listing it). (d) `money supply`
and `leading indicator` are added the same way (`money-supply`,
`leading-indicator` glossary terms) for the m2-us and OECD-CLI cards.

**Reason.** G3's substring matching makes some innocent words land on
jargon (EN "increasing" ⊃ "easing"); the only safe policy is plain wording
for everything except the tiny list of unavoidable instrument names, each
of which must then be a listed glossary term. Extending the map is
explicitly allowed (spec §9 G3: "a jargon list … extend it").

## D-16 — Bundle-budget bumps for the bilingual Layer-1 content (backfilled in the final session; see D-19)

**Assumption.** The Layer-1 copy is 3,152 hand-written strings (1,576 per
language — the exact count the final session's audit script derived from
the dictionaries) riding the already-budget-conscious Insights lazy chunk
(`scripts/check-bundle-budget.mjs` gates it). The repo rule: budgets are
documented numbers — bump with a changelog note, never silently.

**Decision.** Every budget ceiling move happens ONLY with a measured number
in the same commit's CHANGELOG note — the "D-16 path". Applied six times
across the roll-out (Insights lazy chunk, raw/gz kB):

| move | ceiling | measured at the bump |
|---|---|---|
| session 1 (foundation batch) | 896/217 → 940/228 | 914.48/221.13 |
| batch 4 (mid-M1 growth step) | 940/228 → 975/234 | — (no number recorded in that commit; the M1 session note records the session-end 978.09/233.68) |
| batch 8 (M1 end) | 975/234 → 985/236 | 978.09/233.68 |
| batch 9 | 985/236 → 1045/248 | 985.55/235.25 (M2 projection) |
| batch 15 (M2 end) | 1045/248 → 1090/258 | 1047.65/248.08 |
| batch 19 (M3 end) | 1090/258 → 1100/260 | 1092.56/256.31 |

The entry chunk (the money page) was never touched by Layer 1 (295.37/88.84
vs 296/89.50 at the end). Layer 2 must follow the same path — the remaining
headroom is ~0.7% raw / ~1.4% gz, so its first content commit will need a
conscious bump.

**Reason.** The bundle budget is the repo's performance contract; bilingual
content is the one thing Layer 1 legitimately adds. Measuring + noting every
bump keeps the ceiling honest and auditable (the numbers above are the
CHANGELOG's own record — this section backfills the decision text that was
previously only implicit in those notes; see D-19).

## D-17 — M3 display hooks: a shared generic Layer-1 block for markets, FX pairs and FX patterns

**Assumption.** Spec §6 says the expanded view adds the Layer-1 block and
the collapsed card shows `oneLine`. The indicator surfaces already render
this (D-04/D-05: the AlertCard face + the DetailsPanel block). The three
remaining surfaces (world-market detail panels, FX pair detail panels, FX
pattern cards) have their own approved panel layouts (MarketDetail,
PairDetail, PatternCard) that cannot reuse the reading-shaped
DetailsPanel block.

**Decision.** (a) A NEW shared component
`apps/web/src/components/insights/layer1/Layer1Block.tsx` renders the
Layer-1 block for these surfaces: `oneLine` as a small muted lead, then
`ifRising`/`ifFalling` (labelled), `skipReason` + the `noDirection` note
when both are null (pattern cards, D-09), `connections` (names resolved
across indicators/markets/pairs/rules), `australiaAngle` if ever present,
and the glossary list. (b) Placement mirrors D-05: AFTER the approved
what/why/you block, BEFORE the chart (markets, pairs) / before the
Level-3 toggle (pattern cards, Level-2 panel). (c) D-06 emphasis uses the
surface's OWN normal-lens change sign: markets `chg3m` (the section's
normal timeframe, CHG_WINDOW_DAYS=90), FX pairs `chg.m1` (the rules'
alarm lens); pattern cards pass no direction. (d) The collapsed market
tiles, pattern rows and pair table rows are NOT enlarged — `oneLine`
rides at the top of the expanded block on these surfaces instead (the
tile/row hierarchy + status chips stay untouched, the conservative
reading of §6's "do not enlarge cards"). (e) `plainName` renders only in
the indicator DetailsPanel header (D-03); on these surfaces it ships as
data for Layer 2 (the market/pair panels already carry the approved
name + latin + country identity row).

**Reason.** Spec §6 + "only add copy and the smallest possible display
hook". Reusing the exact DetailsPanel markup family (same Section
classes, same order) keeps the visual design system untouched while
giving every surface one consistent Layer-1 block. The per-surface
direction choice reuses each section's own documented "normal" lens
rather than inventing a new one.

## D-18 — Market/pair plain names in new Layer-1 copy drop the digit suffixes

**Assumption.** G6 flags digits in the NEW Layer-1 fields (only
tenor-name tokens are whitelisted). "Nikkei 225", "S&P 500", "Nifty 50",
"ASX 200", "Euro Stoxx 50", "CAC 40", "FTSE 100", "Nasdaq 100" all
carry member-count digits that are NOT tenor names — and the FA Latin
allow-list has no market tickers (N225/DAX are not in FA_LATIN_ALLOW).

**Decision.** The new plain-language fields never carry the numeric
suffix: EN writes around it (Japan's biggest companies; America's main
company list; the S&P without the 500), FA uses the established Persian
names without their Persian-digit counts (نیکی، اس‌اندپی، ای‌اس‌ایکس،
یورو استوکس، داکس، کاک، فوتسی، نزدک، داو جونز، تی‌اس‌ایکس، نیفتی).
The OFFICIAL names (with digits, on tiles/table/panel headers) are
approved copy rendered from `copy.markets.entries`/`copy.fx.entries`
and stay exactly as they are (D-02: approved wording wins; G5/G6 never
apply to approved copy).

**Reason.** The digits are the index's membership count — pure jargon to
the target reader — so dropping them from the plain-language layer is
both the only gate-clean option and the plainer one. The official name
remains one glance away on the same tile/panel.

## D-19 — Final-session reconciliation: the decision-log completeness pass (the D-15 gap, the D-16 backfill, the final report)

**Assumption.** Preparing the verification handoff
(`docs/insights/layer1/FINAL-REPORT.md`) for an independent checking agent,
the final session audited DECISIONS.md against every D-nn citation in the
repo and found two numbering gaps: **D-15 has no record anywhere** (the
number was reserved in the M1-era numbering and the session that introduced
D-16 — batch 4 — evidently skipped past it), and **D-16 was cited without
ever having a section here** (six times in the CHANGELOG, in five batch
commit messages, and self-referenced in D-01's reason).

**Decision.** (a) D-16 is backfilled above from its own CHANGELOG record
(the six budget bumps, five of them with recorded measurements — the
numbers are quoted verbatim from the session notes; nothing new is
invented). (b) D-15 is recorded as a
PERMANENT GAP — no content is retro-fitted for it because no record of its
intended content survives; inventing one would corrupt the log. (c) The
CHANGELOG's Layer-1 M2/M3 section headers carry the date label 2026-10-29
while the underlying commits landed 2026-10-27/28 UTC — noted here as a
known label quirk, left as-is (the headers are historical records; the git
timestamps are the source of truth). (d) The final report
(`FINAL-REPORT.md`) is the single verification surface for the checking
agent: scope, file map, gate numbers, deployment record, independent
re-audit results, and the honest caveats.

**Reason.** The task rule is "log anything ambiguous as D-19+" — a decision
log that cites a decision it never wrote, and a checking agent that cannot
see the gaps, are both worse than an honest hole. The gap does not affect
any shipped behavior (D-15 was never cited by any code, test, or copy).
