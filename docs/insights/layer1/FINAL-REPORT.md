# Layer 1 — Final Report & Verification Handoff

**Audience:** an independent checking agent, engaged by the owner to verify
the Layer-1 implementation before Layer 2 starts.
**Written by:** the final Layer-1 session (2026-10-28, commit `1f2b83a` +
this report commit; deployed worker `c02d736a`).
**Status: Layer 1 is COMPLETE and LIVE — 129/129 unique ids, both locales,
zero data changes.**

Everything in this report was re-verified by the final session itself, from
a clean clone, unless explicitly marked otherwise (§8 distinguishes "verified
by direct inspection" from "recorded by earlier sessions and re-verified in
aggregate by the gates"). The honest caveats are in §9 — read them before
signing off.

---

## 0. How to verify (commands + expected outputs)

Run from the repo root (pnpm 10.34.5, Node ≥ 20):

```sh
pnpm install

# 1. The Layer-1 validator, strict mode (G1 completeness hard-fails)
LAYER1_STRICT=1 pnpm --filter @currena/web exec vitest run src/components/insights/layer1/layer1.test.ts
#   expected: 7809 tests passed (1 file), exit 0

# 2. Repo gates
pnpm -r run typecheck          # 6/6 packages Done, exit 0
pnpm copy:audit                # ends with "✓ clean"
pnpm -r run build && node scripts/check-bundle-budget.mjs
#   expected: entry 295.37/88.84 (budgets 296.00/89.50)
#             Insights lazy 1092.56/256.31 (budgets 1100.00/260.00)
pnpm lint                      # exit 0, no output
pnpm -r run test               # core 191, scraper 67, insights 677,
                               # markets 13, api 344, web 8525 — all passed

# 3. Live site (what the deployment actually serves)
curl -s https://currena.ir/api/health          # {"ok":true,...,"kv":"ok"}
curl -s https://currena.ir/api/insights | head -c 200   # snapshot JSON, 100 readings
for ep in markets fx status; do curl -s -o /dev/null -w "%{http_code}\n" "https://currena.ir/api/insights/$ep"; done   # 200 200 200
```

Browser checks (any modern browser, https://currena.ir/#/insights):
expand one indicator card ("More details"), one market tile, one FX pair
row (Show all currency pairs), and the first FX pattern card — a Layer-1
block (labelled IF IT RISES / IF IT FALLS / HOW IT CONNECTS) must render in
each. Switch locale via `localStorage.setItem('currena:locale','fa')` +
reload — the same blocks render in Persian («اگر بالا برود» / «اگر پایین
بیاید» / «ارتباط با»). At 360px width there must be no horizontal scroll.
Expected DOM marker on every expanded surface: `[data-layer1-block]`.

---

## 1. Executive summary

Layer 1 of the Insights plain-language spec
(`docs/insights/layer1/PLAIN-LANGUAGE-SPEC.md`) added hand-written,
plain-language EN + FA copy for **every indicator on the Insights page**:
100 economic indicators, 16 world stock indices, 10 FX pairs and 7 FX
pattern cards = **129 unique ids** (the 4 ids that are both an FX pair and
an indicator get ONE shared entry each; the inventory table's 133 rows
count them twice — decision D-13).

What each id got (`Layer1Entry`, defined in
`apps/web/src/i18n/insights-copy-en.ts`) — 3,152 hand-written strings in
total (1,576 per language, machine-counted in the final audit):

| field | constraint | notes |
|---|---|---|
| `plainName` | ≤ 6 words | friendly label; rendered in the expanded indicator panel header (D-03); markets/pairs drop the membership digits (D-18) |
| `oneLine` | ≤ 16 words, 1 sentence | ALWAYS-TRUE everyday effect; on the collapsed indicator card face (D-04) + the lead of the shared block on other surfaces (D-17) |
| `ifRising` / `ifFalling` | ≤ 22 words, 1 sentence, or `null`+`skipReason` | `null` only for the 7 pattern cards (a pattern is a relationship, not a level — D-09) |
| `connections` | 0–3 links | each names another id + a one-line claim; verified live: all 129 entries carry ≥1, max 3 |
| `australiaAngle?` | optional | 32 entries: all 23 AU indicators + 9 AU-relevant globals (D-08) |
| `glossaryTerms` | ids into the 23-term glossary | every jargon word used is a listed term (G3) |
| `skipReason?` | only when directions are null | the 7 pattern cards |

The approved `whatItIs` / `whyItMatters` were **not** rewritten — they are
reused from the existing audited copy (D-02: approved wording always wins
over the style guide).

**What did NOT change (the guardrails):** data fetching, thresholds,
verdict math, KV usage, the visual design system. Layer 1 adds zero KV
operations and zero external calls (free-tier safe, gate G10). The 129
indicator readings the API serves are byte-identical in shape and source to
the pre-Layer-1 state — Layer 1 is copy + display hooks only.

**Deployment:** currena-api `c02d736a-c0f8-45bf-89bb-f0629ab3ecaf`
(2026-10-28 08:33 UTC), preceded by the owner's deploy-lock check
(§6). Live at https://currena.ir.

---

## 2. What shipped, per surface

| surface | collapsed face | expanded view | hook |
|---|---|---|---|
| Indicator cards (100) | `oneLine` as a caption-sized muted line at the bottom of the card face (D-04) | the DetailsPanel grouped block: ifRising/ifFalling (the direction-matching line emphasised, CSS only — D-06), connections, australiaAngle, glossary; `plainName` beside the official name in the panel header (D-03/D-05) | `apps/web/src/components/insights/DetailsPanel.tsx` (`data-layer1-block`), `AlertCard.tsx` line ~329 (`l1.oneLine`) |
| World market tiles (16) | unchanged (tiles not enlarged — D-17d) | the shared `Layer1Block` after the approved what/why/you, before the chart; direction emphasis = the 3-month change (the section's normal lens) | `world-markets/MarketTile.tsx` line ~250 (`<Layer1Block … changeDir={entry.chg3m}>`) |
| FX pair panels (10) | unchanged (table rows not enlarged) | the shared `Layer1Block` in the pair detail; direction emphasis = the 1-month change (the rules' alarm lens) | `world-currencies/PairsTable.tsx` line ~95 (`changeDir={entry.chg.m1}`) |
| FX pattern cards (7) | unchanged (rows not enlarged) | the shared `Layer1Block` in the Level-2 panel with the noDirection note (both directions null, D-09) | `world-currencies/PatternCard.tsx` line ~161 (no direction) |

The shared component is `apps/web/src/components/insights/layer1/Layer1Block.tsx`
(D-17). Every expanded surface carries the DOM marker `[data-layer1-block]`
— that is the marker the render checks assert.

The 4 shared FX ids (`usdjpy`, `audusd`, `usdcny`, `audjpy`) render the
SAME entry on both the FX board and the indicator cards — one entry per id
(D-11), spot-verified live on USD/JPY and AUD/JPY in the final session
(screenshots `live-en-shared-audjpy-1280.png` + the usdjpy pair/indicator
DOM checks in the session record).

---

## 3. Where everything lives (file map)

```
apps/web/src/i18n/insights-copy-en.ts        EN dictionary — the `layer1` object
                                             (ui labels, 129 indicator entries, 23 glossary terms)
apps/web/src/i18n/insights-copy-fa.ts        FA dictionary — same shape, compile-time shape-checked
apps/web/src/components/insights/layer1/
  index.ts                                   typed accessors: getIndicatorCopy(id, lang),
                                             getGlossary, getGlossaryTerm, getLayer1Ui,
                                             LAYER1_INDICATOR_IDS (129), LAYER1_GLOSSARY_IDS (23),
                                             LAYER1_INVENTORY_IDS (134 = 129 + the 4 shared counted twice)
  Layer1Block.tsx                            the shared display block (markets, pairs, patterns)
  layer1.test.ts                             the G1–G8 validator (7,809 assertions)
  README.md                                  the accessor contract + rendering notes (D-17)
docs/insights/layer1/
  PLAIN-LANGUAGE-SPEC.md                     the spec (§4 fields, §5 source, §6 display, §8 honesty, §9 gates)
  DECISIONS.md                               D-01..D-14, D-16..D-19 (D-15 = documented gap, see §9)
  INVENTORY.md                               the 133-row / 129-id inventory, all ✓
  COPY-REVIEW.md                             the per-claim review log (batches 1–19) + final status
  FINAL-REPORT.md                            this file
docs/insights/screenshots/layer1-final/      17 live-verification screenshots (§7)
docs/insights/screenshots/layer1-m3/         5 M3 render-check screenshots (local, live-API proxy)
docs/insights/screenshots/layer1-2026-10-28/ session-1 render-check screenshots
scripts/check-bundle-budget.mjs              the budget gate (documented ceilings, see §5)
docs/DEPLOY.md                               the deploy runbook + the final session's deploy record
CHANGELOG.md                                 the four Layer-1 session sections (top of file)
```

The Layer-2 contract (what the next layer imports) is
`apps/web/src/components/insights/layer1/index.ts` — `getIndicatorCopy(id, lang)`
returns the NEW fields; the approved `whatItIs`/`whyItMatters` come from the
existing `copy.indicators[id]` structure (D-02). No AI runs in Layer 1; the
copy is static and bundled.

---

## 4. The decision log, one line each

| id | decision |
|---|---|
| D-01 | copy lives as a `layer1` object on the existing EN/FA dictionaries (lazy-loaded, audit-swept, shape-checked) |
| D-02 | reuse approved `whatItIs`/`whyItMatters`; only the NEW fields are written and validated |
| D-03 | `plainName` ships as data; rendered only in the expanded indicator panel header |
| D-04 | `oneLine` = one new caption-sized muted line on the collapsed card face |
| D-05 | the expanded panel gets a NEW grouped block; existing section order untouched |
| D-06 | direction emphasis is CSS-only (font/colour), no new wording |
| D-07 | the validator's gates G1–G8; strict mode (`LAYER1_STRICT=1`) hard-fails completeness — the final session runs it |
| D-08 | `australiaAngle` on the 23 AU indicators + 9 AU-relevant globals only |
| D-09 | `ifRising`/`ifFalling` null + `skipReason` only for the 7 pattern cards |
| D-10 | glossary term ids are kebab-case concept slugs; FA `term` carries the Persian term |
| D-11 | markets + FX pairs + patterns in scope; the 4 shared FX ids get ONE entry each |
| D-12 | land on main, `insights(L1): …` commits, deploy only in the final session after the deploy-lock check |
| D-13 | inventory arithmetic reconciled to code: 133 rows → 129 unique ids |
| D-14 | write around jargon-null terms; PMI/VIX/carry-trade/money-supply/leading-indicator added to the map with glossary entries |
| D-15 | **(gap — no record survives; documented as a permanent gap by D-19)** |
| D-16 | bundle-budget bumps only with measured numbers in the changelog (six bumps, 896/217 → 1100/260) — backfilled as a section by D-19 |
| D-17 | the shared `Layer1Block` for markets/pairs/patterns; per-surface direction lens; collapsed faces not enlarged |
| D-18 | market/pair plain names drop the membership digits in NEW copy only («نیکی», "Japan's biggest companies"); official names untouched |
| D-19 | the final-session reconciliation: the D-15 gap, the D-16 backfill, this report |

---

## 5. Gates — final-session numbers (clean clone, 2026-10-28)

Every gate was re-run by the final session from a clean state before the
deploy (the D-07 protocol). Numbers are from that run; the checker re-runs
them via §0.

| gate | result |
|---|---|
| `LAYER1_STRICT=1` layer1.test.ts | **7809/7809 passed** (G1 completeness + G2 length + G3 jargon + G4 banned words + G5 Farsi hygiene + G6 digits + G7 readability + G8 en↔fa parity) |
| `pnpm -r typecheck` | 6/6 packages green |
| `pnpm copy:audit` | **✓ clean** — every user-facing Persian string matches its reviewed fingerprint (manifest 4,546 entries, all triaged through the `layer1` round) |
| build + `check-bundle-budget.mjs` | entry chunk 295.37/88.84 kB vs budgets 296.00/89.50; Insights lazy 1092.56/256.31 kB vs budgets 1100.00/260.00 — **held** (the D-16 ceiling) |
| `pnpm lint` | 0 errors |
| `pnpm -r test` | core **191**, scraper **67**, insights **677**, markets **13**, api **344**, web **8525** = **9,817 total, all green** (identical to the M3 record) |
| local render-check (dev server, `DEV_API_PROXY=https://currena.ir`) | all four surfaces × EN/FA × 1280px/360px: `[data-layer1-block]` present, zero horizontal overflow, zero console errors |
| G9 (headless render) | reported here + §7: verified on all four surfaces, both locales, both widths |
| G10 (free-tier safety) | zero added KV operations, zero added external calls (code-inspected + the topology unchanged) |

Reproducibility note: the same strict validator count (7809) was produced
by the M3 session and twice by the final session (pre-deploy and, again,
on the clean tree while writing this report).

---

## 6. Deployment record

- **Deploy-lock check first** (the D-43 lesson, `docs/DEPLOY.md`): the
  Cloudflare versions + deployments APIs showed the last currena-api
  upload at **2026-10-27T18:31:05Z** (`27f42b9c` — the R10 session's
  deploy, recorded in `docs/insights/ROUND10_REPORT.md` STEP 11 and the
  CHANGELOG §Round 10). That predates the M3 pushes (`f3ad520..2f884a1`,
  2026-10-28 06:45–08:11 UTC) by ~14h → **no parallel session deployed
  while M3 ran**. The two versions newer than the prior newest in-file
  record (`f489a69a` 2026-10-27T00:57Z, `babce831` 2026-10-27T04:06Z) are
  the 16-failure fix and the R9 deploy — both repo-recorded, both
  ancestors of the deployed HEAD. `git fetch` confirmed origin/main at
  `2f884a1`. Lock CLEAR.
- **Deploy**: `pnpm --filter @currena/web build` → `pnpm --filter
  @currena/api exec wrangler deploy` → currena-api
  **`c02d736a-c0f8-45bf-89bb-f0629ab3ecaf`** (2026-10-28 08:33 UTC, 18 new
  assets; the Insights chunk `Insights-p-JnCvcS.js` carries the Layer-1
  content). currena-markets was NOT redeployed: Layer 1 touches `apps/web`
  + docs only; the only `packages/` delta since R10 is comment-only (the
  2026-10-28 docs tidy-up), so the deployed markets worker is functionally
  identical to HEAD.
- **Rollback path** (not needed): `pnpm --filter @currena/api exec
  wrangler rollback` (docs/DEPLOY.md §Rollback).
- The docs-only commit that carries this report is deployed after the fact
  per the runbook's "Redeploy the latest HEAD" note (runtime-identical);
  the deployment id lands in DEPLOY.md's session record and the CHANGELOG.

---

## 7. Live verification evidence (2026-10-28, post-deploy)

API sweep: `/api/health` 200 (`ok:true, kv:ok`); `/api/insights` 200 with
**100 readings** (generatedAt 2026-10-28T04:20Z — the data pipeline
untouched); `/api/insights/markets`, `/api/insights/fx`,
`/api/insights/status` all 200.

Browser sweep on https://currena.ir (both locales, 1280px and 360px), each
surface expanded and its Layer-1 block content read from the DOM:

| surface | id | EN ✓ | FA ✓ | 1280 ✓ | 360 ✓ |
|---|---|---|---|---|---|
| indicator card details | `brent` | ✓ | ✓ | ✓ | ✓ |
| market tile detail | `n225` (Nikkei) | ✓ | ✓ | ✓ | ✓ |
| FX pair panel | `eurusd` | ✓ | ✓ | ✓ | ✓ |
| FX pattern card | `r6_europe_worry` (open at Level 2 by default — spec §"only the first card is open by default") | ✓ | ✓ | ✓ | ✓ |
| shared-id check | `usdjpy`, `audjpy` — the SAME entry on the pair panel and the indicator card details (D-11) | ✓ | — | ✓ | — |

Zero console errors, zero page errors, zero horizontal overflow at 360px in
every pass; FA renders fully RTL with Persian digits.

**Screenshots (17)** in `docs/insights/screenshots/layer1-final/`:
`live-{en,fa}-{indicator-brent,market-n225,pair-eurusd,pattern-r6}-{1280,360}.png`
(16 combinations) + `live-en-shared-audjpy-1280.png` (the D-11 catch).
Earlier local evidence: `layer1-m3/` (5) and `layer1-2026-10-28/` (session 1).

---

## 8. Independent re-audit (this report's own verification — what was checked by direct inspection)

The final session did not just re-run the gates; it re-derived the headline
claims from the source files (a standalone Node script importing the two
dictionaries, plus targeted greps). Results:

| claim | check | result |
|---|---|---|
| 129 EN entries | `Object.keys(en.layer1.indicators).length` | **129** |
| 129 FA entries, same ids | key-set equality EN vs FA | **true** |
| 23 glossary terms, both languages, same ids | key-set equality | **23 = 23, true** |
| every entry has all required fields | field scan, both languages | **none missing** |
| pattern cards null-direction | `ifRising === null` + `skipReason` present, all 7 | **confirmed** |
| the 4 shared FX ids appear once each | count in EN keys | **usdjpy 1, audusd 1, usdcny 1, audjpy 1** |
| australiaAngle scope | count | **32 entries** (23 AU + 9 globals, per D-08) |
| connections bounds | min/max per entry | **all 129 have ≥ 1; max 3** |
| banned FA words in Layer-1 indicator copy (نسبت / سهام / سنجه / اسپرد / انتظار تورم) | grep of the FA `layer1` section | **0 hits in indicator copy fields**; the only 2 «سهام» occurrences are inside glossary `plain` fields (`stock-index`, `vix`) — G3 explicitly allows the jargon word in the glossary entry that defines it |
| EN "easing" substring (e.g. "increasing") | case-insensitive grep of the EN `layer1` section | **0 hits** |
| ASCII digits in FA layer1 strings | grep | **0** (Persian digits only; validator G5/G6 also enforce) |
| em dash in FA copy | grep | **0 in copy** (19 hits are `/* batch-header comments */`, not user-facing) |
| Arabic ي/ك in FA copy | grep | **0** |
| display hooks present | grep of the five components | **confirmed** (AlertCard `l1.oneLine`; DetailsPanel block + plainName + D-06 emphasis; MarketTile `Layer1Block changeDir={chg3m}`; PairsTable `changeDir={chg.m1}`; PatternCard no direction) |
| G3's checked-field scope | `entryProse()` in the test | exactly the six new fields; glossary + approved copy exempt (D-02/D-07) |
| UI labels complete | `getLayer1Ui` both languages | 6 labels each, identical key sets (ifRising, ifFalling, connections, australiaAngle, plainWords, noDirection — the `Layer1Ui` interface; D-01's original sketch also listed whatItIs/whyItMatters, but those ride the approved copy per D-02 and are not duplicated in `ui`) |

What is "recorded by earlier sessions and re-verified in aggregate": the
per-batch claims in COPY-REVIEW.md (the one-line review basis per claim).
The aggregate gates (G1–G8 over all 129 entries × 2 languages, plus the
live DOM reads in §7) are what the final session verified directly; the
per-claim prose review basis ("widely-taught", "definitional",
"needs-expert-check") is the earlier sessions' editorial judgement,
preserved in COPY-REVIEW.md for exactly this check.

---

## 9. Honest caveats & known limitations

The checking agent should weigh these; none blocks Layer 2, but all are
true and none were hidden:

1. **Ten `needs-expert-check` claims** (COPY-REVIEW.md; the count is 10 —
   a grep also matches the legend line that defines the status): 7
   australiaAngle bases (us10y, fed-target, real-yield-10y,
   dollar-basket, usdjpy, us-japan-10y-gap, usdcny — the AU-transmission
   reasoning), and 3 softened `sometimes` connections (asx200↔audusd,
   dow↔ndx, r7_dollar_or_euro↔stoxx50). These claims ARE live on the
   site. They were softened where possible and flagged for human review;
   an expert pass over these 10 rows is the single most valuable review
   action before Layer 2.
2. **The D-15 decision-log gap** (now documented as D-19): D-15 was never
   written; D-16 existed only as CHANGELOG citations until this session
   backfilled its section. No code, test, or copy ever cited D-15; the gap
   is documentation-only.
3. **CI is red on GitHub Actions since 2026-10-20** (account-side
   Actions-minutes/runner issue, documented in DEPLOY.md 2026-10-26b and
   every session record since). Every Layer-1 commit relied on the local
   full-gate discipline instead (the numbers in §5). The CI repair is
   owner-side.
4. **AU data staleness is pre-existing, not Layer 1**: R10 documented the
   Cloudflare Worker's egress being Akamai-blocked on rba.gov.au paths —
   `au-10y`, `rba-expectations`, `au-us-10y-gap` readings are stale at
   2026-09-30. Layer 1 adds zero data changes; the cards (including their
   Layer-1 copy) render normally. Fixing the venue is a data-layer task.
5. **CHANGELOG date labels**: the Layer-1 M2/M3 section headers say
   2026-10-29 while the commits landed 2026-10-27/28 UTC (the sessions'
   label convention). Git timestamps are the source of truth; recorded in
   D-19(c) rather than silently rewritten.
6. **Budget headroom is thin**: 1092.56/1100 raw (~0.7% headroom),
   256.31/260 gz (~1.4%). Layer 2's first content commit must take the
   D-16 path (measured bump + changelog note), not assume room.
7. **The FA copy is hand-written and audit-triaged, not
   native-speaker-reviewed end-to-end**: sessions wrote Farsi natively and
   the copy:audit fingerprint manifest (4,546 entries) is the review
   surface, but a native-speaker pass over the glossary + the 32
   australiaAngle entries would still add value. The recurring FA
   constraints (no «نسبت» even in «نسبت به»; no «سهام»/«سنجه»/«اسپرد»/
   «انتظار تورم» in indicator copy; no EN words containing "easing") are
   enforced by the validator AND were independently re-grepped for this
   report (§8).
8. **The first pattern card is open by default** (spec behaviour: "only
   the first card is open by default") — so a `[data-layer1-block]` is
   present on first paint of the currencies section. This is intended, not
   a leak of the expanded state.
9. **The markets worker was not redeployed with Layer 1** — by design
   (functionally identical; §6). If the checker wants deployed-code parity
   across all workers, a currena-markets redeploy is a safe no-op.
10. **The sessions-1–4 sandbox worklog did not survive into the final
    environment** (fresh sandbox); its content is fully mirrored in the
    repo records this report cites (CHANGELOG, DECISIONS, INVENTORY,
    COPY-REVIEW, DEPLOY.md, the git history). The final session's worklog
    entry records this.

---

## 10. Layer-2 readiness

Layer 2 (the AI-driven live-state explainer, explicitly OUT of Layer 1's
scope) can rely on:

- `getIndicatorCopy(id, 'en'|'fa')` — the six new fields per id (129/129,
  both languages, compile-time shape parity).
- `getGlossary(lang)` / `getGlossaryTerm(termId, lang)` — the 23-term
  bilingual glossary.
- `getLayer1Ui(lang)` — the block labels, including `noDirection`.
- `LAYER1_INVENTORY_IDS` — the single id list the validator enforces
  against (add an indicator without copy and G1 fails the build).
- The vocabulary contract is documented in
  `apps/web/src/components/insights/layer1/README.md` (shape + API +
  rendering, D-17).
- G1's orphan check already protects Layer 2: no Layer-1 entry can exist
  for an id that is not in the code inventory, and no id can ship without
  an entry once `LAYER1_STRICT=1` is the default expectation for L2-era
  commits.

Constraint handover for Layer 2 (the ones that bite): the FA banned-word
list (§9.7), the G6 tenor-name digit whitelist, the "approved wording
wins" precedence (D-02), and the D-16 budget path (§9.6).

---

## 11. Verification checklist for the checking agent (tl;dr)

- [ ] §0 commands produce the §5 numbers (7809/7809; 9,817 total; budgets
      held; copy:audit clean)
- [ ] live site: 4 surfaces × 2 locales render the block (§0 browser part,
      §7 table)
- [ ] 360px: no horizontal scroll, EN + FA
- [ ] shared ids: usdjpy/audusd/usdcny/audjpy — one entry on both surfaces
- [ ] spot-check 5 random ids' copy against COPY-REVIEW.md's claims table
- [ ] spot-check the 10 needs-expert-check rows (§9.1) — the expert review
- [ ] confirm zero diff in `packages/insights` logic vs the pre-L1 state
      (data untouched; `git diff e04c9d0..HEAD -- packages/ apps/api` is
      comment-only in packages, none in apps/api)
- [ ] read §9 caveats and accept/escalate each

*End of report.*
