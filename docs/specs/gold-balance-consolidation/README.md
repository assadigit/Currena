# Gold balance consolidation: spec set

**Status:** SPECIFIED, NOT IMPLEMENTED (2026-10-31). The owner approved the
full recommendation set in chat on 2026-10-31 and asked that each
recommendation be re-checked against the code before it is written down.
This set is the result of that re-check (see "What the re-check changed").

**Owner intent (UX):** two metaphors for one question (the Balance and the
Wind meter) are unnecessary cognitive load for the owner and for users.
Keep the Balance. Fold the Wind meter's indicators and items into it, so
that everything about gold is shown by one balance.

## Files

| File | Purpose |
|---|---|
| `README.md` | This index, the decision log, open items, what the re-check changed |
| `01-SPEC.md` | The master spec: problem, principles, the consolidated model, the verdict, the honesty rules |
| `02-ENGINE-AND-DECISION-TABLE.md` | The pure engine API, the 21-voter table, the one-rule-per-indicator decision table, the lane vote rule, the pre-registered calibration protocol |
| `03-UX-AND-COPY.md` | Visual anatomy, states, interaction, accessibility, RTL, the EN copy and FA drafts, copy keys kept and retired |
| `04-MIGRATION-AND-ACCEPTANCE.md` | File-by-file change list, wire compatibility, rollout, tests, gates, acceptance criteria, risks |
| `05-VISUAL-DESIGN-SPEC.md` | The visual redesign of the balance: layout, brass beam, lane weights, verdict block, tokens, type, motion, states, responsive rules, visual acceptance criteria. Supersedes 03 §1 where it says the geometry is untouched |

Reading order: 01, 02, 03, 04, 05.

## Decision log

| ID | Decision | Why (short) |
|---|---|---|
| D-GB-1 | Keep the Balance. Retire the Wind meter UI (`GoldTailwindPanel`) and the model-vs-reality panel UI. | The Balance is the more honest metaphor for an equal-weight count of conditions. The backtest gives wind no forecasting claim. |
| D-GB-2 | One pan item = one **lane** (4 chips: borrowing costs, dollar, market stress, inflation). A chip opens its member voters in the existing detail panel. | The Balance's 4 conditions already map 1:1 onto the 4 lanes. Counting lanes stops 8 collinear rate voters from dominating. |
| D-GB-3 | A lane votes only when at least 2 of its voters fire, and then by strict majority of the firing voters. A tie reads "mixed" and sits in the neutral tray. | Same crowd-minimum philosophy as `GOLD_STRONG_MIN_FIRING`. One voter alone must not tip a whole lane. Pre-registered calibration (02 §6) can fall back to a minimum of 1. |
| D-GB-4 | One shared evaluator (`evalLeg`) and one rule per indicator. The Balance's bespoke stress rule and expectations rule are retired. | The two engines disagree today on dollar, inflation expectations and stress because they use different rules. |
| D-GB-5 | Gold's own price move ("footing") is removed from the verdict. It stays as a non-voting context line under the beam. | Counting a falling price as evidence of a falling price is circular. |
| D-GB-6 | The gold Outlook card is derived from the unified balance, so card and balance cannot contradict each other. | Today the Outlook (5 conditions with footing) says Bearish while the Balance says Balanced. |
| D-GB-7 | The meaning is "conditions today, not a forecast". The model-vs-reality chip UI is retired. The measured note and the backtest link stay, visible. | `docs/insights/BACKTEST-GOLD.md`: no edge, and the association ran the other way over 2021 to 2026. |
| D-GB-8 | The beam angle formula is unchanged (`|net| / (for + against) x 10`, clamped to 3 to 10 degrees). | Preserves the owner's 2026-10-21c decision. Thin evidence is shown by the counts line, not by a new cap. Easy to revisit (OI-6). |
| D-GB-9 | `goldTailwindScore`, `goldSummary`, `gold-score.ts` and the backtest harness lineage stay frozen and keep running. The new engine is additive. | The re-check and backtest procedures (`GOLD_RECHECK_SPEC.md`) read `goldSummary`, and an armed check runs on 2026-11-02. |
| D-GB-11 | The balance gets a visual redesign (owner request, 2026-10-31): spacious, brass beam balance, lane weights with a segmented rim, the verdict as the hero. Spec in 05. Behaviour and beam formula unchanged. | The current drawing is small and low contrast, and the answer (the verdict) is its weakest element |
| D-GB-10 | Delivery is a branch and a pull request. Nothing is committed to `main` directly. A preview parameter gates the visible change until the owner flips it. | The change is visible to every visitor (the Outlook word can change). |

## Open items for the owner

| ID | Question | Proposed default |
|---|---|---|
| OI-1 | The Outlook sentences ("Signs point to a potential decline in gold prices" and the six siblings) were written by the owner. They state a forecast, which the backtest does not support. Reword? | Keep the seven states and their order. Reword the bullish and bearish sentences to describe conditions. Proposed text in 03 §6. Needs an FA copy round. |
| OI-2 | The label of the "mixed" lane badge. | "Split" (EN). FA draft in 03 §6. |
| OI-3 | When may `goldSummary` and the wind copy keys be removed? | Not before the 2026-11-02 armed check has run and `GOLD_RECHECK_SPEC.md` is updated. A separate PR. |
| OI-4 | The silver Outlook has the same circularity (6 conditions, one of them silver's own 30-day footing). | Out of scope here. Recorded as a follow-up. |
| OI-5 | Persian copy review round for all new strings. | Required before the preview flag is flipped (the `copy:audit` gate). |
| OI-6 | Soften the one-sided beam tip (for example a 6 degree cap when fewer than 3 lanes vote)? | No. Keep the owner's current rule. Revisit after seeing the preview. |

## What the re-check changed (versus the chat recommendations)

1. **Lane rule got a crowd minimum.** In chat the lane vote was "majority of
   firing voters". Applied to the 2026-10-31 reading, that rule tips the beam
   the full 10 degrees against gold on two lanes that each have exactly one
   firing voter (dollar: USD/JPY only; inflation: 5y5y only). That would be a
   new overclaim. D-GB-3 adds the minimum of 2 firing voters, and a
   pre-registered calibration run so the rule is chosen on stated criteria
   and not on forward returns.
2. **"No read" is split in two.** The wind panel shows "no read" both for a
   lane with no readable data and for a lane whose readings are steady and
   typical. The consolidated model separates `unread` (nothing readable) from
   `neutral` (readable, nothing firing).
3. **Rule conflicts are resolved by table, not by choosing one engine.** One
   shared evaluator is used everywhere. The only bespoke rules (stress sign
   rule, expectations status rule) are retired, and the B-12 wording
   constraint (never describe expectations as elevated beside a Normal card)
   is kept as a copy rule.
4. **The new engine must not edit the frozen one.** The first draft implied
   changing `gold-score.ts`. D-GB-9 forbids it: the recheck and backtest
   lineage depend on it.
5. **Expected visible consequence is stated up front.** On the 2026-10-31
   data the consolidated balance reads level and the Outlook reads Neutral
   (not Bearish). This is the honest result, not a regression. See 01 §7.

## Out of scope

Silver (its balance was retired by the owner on 2026-10-21c). New data
sources. New voters. Re-weighting. Any forecasting claim. The Persian number
and digit formatting rules (unchanged). Removing `goldSummary` from the wire.

## Coordination

The gap-closure program runs in parallel (`docs/gap-closure/`). Before editing
a shared file (`AGENTS.md`, `CHANGELOG.md`, `docs/INDICATORS_AND_DATA_SOURCES.md`,
the i18n dictionaries, `definitions.ts`), run `git pull --rebase` and re-read
it. This stream is the owner's Gold Program, so editing gold files here is
authorised; the file list is in 04 §1.
