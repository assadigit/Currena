# Gold UX Redesign — Session 10: the Q3-A execution (the ratio-only home)

> Agents: read `AGENTS.md` in the repo root first, and follow it for this whole task.

**Session:** the post-program gated change — the owner's Q3 answer (**A — the ratio-only home**) arrived after the 9-session program closed (report 17 §5 held it: "the gated change executes inside its own conscious, tested session"). The Q1-B pattern, executed whole.
**Branch:** `feat/gold-redesign-s10-q3a` (merged to `main` at the close)
**Date:** 2026-11-2x
**Companion records:** `DECISION_LOG.md` S10-D1…S10-D7 · `docs/HANDOFF.md` (the session block) · `CHANGELOG.md` (the dated entry) · the round-95 file `docs/localization/persian-copy-round-95-gux-s10-q3a.md` · the evidence `baseline-screenshots/s10/` + its README · BD-S52 in `docs/DECISIONS.md`
**The state this session changed from:** `origin/main` `9fcc647c` (the S9 close) — deployed live as currena-api `2f101b25` (production untouched until this session's own deploy; the D-43 discipline ran FIRST).

---

## 1. The answer and the scope (S10-D1/S10-D2)

**The owner answered A — the ratio-only home.** The message quotes the option back in the owner's own words, A first with the recommendation's rationale ("the product hierarchy has no silver-briefing slot on the gold page, and the card's own note already says a silver strip returns only on measured reader demand"), B and C as the alternatives not taken, and fresh deploy credentials attached (the standing signal to execute).

**What rendered differently — the whole of it:**

| Surface | Before (the S9 close) | After (this session) |
|---|---|---|
| The VerdictStrip | TWO analysis cards side-by-side (gold + silver), the gold card carrying the interactive chart, the silver card carrying its own TrendPanel chart + its outlook sentence + the keep-small note | ONE card — gold's: the artwork + name + price + the gold conditions sentence + the interactive chart |
| The card header | TWO lean lines (gold's lane-model line + silver's legacy per-condition sentence, OI-4) | ONE line — gold's lane-model prose (the same words, one engine) |
| The collapsed summary | TWO lines (gold's lane prose + silver's legacy sentence + takeaway) | ONE line — gold's |
| The price footing strip | TWO rows (gold + silver) | ONE row — gold's |
| The section title/subtitle | "Conditions for gold and silver" / "each metal" | "Conditions for gold" / "gold" (round 95, both locales) |
| `mergeSignals` + the silver-only condition copy | live in shared/config + both dictionaries | RETIRED (the R26 artifact went with the structure it served) |

**Silver's three surviving seats — untouched, verified in the captures:** the `gold-silver` ratio seat (the stress lane's voter — the frozen engine table), the if-you'd-bought row's silver asset, and the London vault's silver row (`ratio-seat-*`, `ifbought-*`, `vault-silver-row-*` in the s10 set).

## 2. What was verified (and how)

- **The tests:** the OI-4 pins flipped to the new contract — the silver row/card/chart/keep-small-note/footing-row are asserted ABSENT (the battery of five scenarios + the GoldPage touch-floor test + the F17 test); the strip-never-hides rule pinned (all-lanes-unread renders `verdictNone`, never silence); the GB-S6 byte-stability snapshot **consciously re-pinned** (the gold-only markup — 0 silver references, verified); the parity tests narrowed to the gold-only shape; a new pin holds that no silver key survives either dictionary while the ratio seat's own voter name does.
- **The suite:** the full gates **10/10 GREEN (3m 6s)** — the suite **15,658** (the S9 close was 15,659: the one-test delta = the retired mergeSignals spec; the flipped OI-4 pins are rewrites in place); copy:audit **clean (round 95, the manifest 9,251)**; the narrator vocabulary in sync after the gate-forced regeneration (the S5-M6/S9-D2 precedent — the two fingerprint lines only); lint **0/0** (the fresh cache surfaced four latent errors in the S9 keyboard probe — fixed in-session, the probe-census precedent).
- **The model-unchanged proof:** `git diff` over the session's range — `packages/` changes in exactly the generated vocabulary's two source-fingerprint lines; **core, scraper, the engine's own sources, both workers and the registry byte-unchanged.** `evaluateSignal`/`evaluateSignals`/`outlookOf` stay exported and engine-tested; the /gold UI simply stops calling them for silver. No polarity, threshold, score, voter, lane or data state changed.
- **The budget:** GoldPage **223.66/50.13 under 240,000/55,500** at every milestone — the change SHRANK the gold chunk ~2.3 kB raw. The one budget event: the AU ceiling bump 41→50 raw / 11→13 gz (S10-D6 — rollup re-bucketed the shared TrendChart module into the AU route after the gold feature dropped its import; the AU page's own code byte-identical, the total dist shrank 5,963 bytes; the §19.6 re-bucketing convention, the verification inline in the budget script).
- **The visual evidence:** the s10 set, **12/12 green** over the fixture server (en/fa × 1440-light/390-dark, the REAL theme key) — the changed surface with the contract asserted in-test before every shot, plus the three survivor seats (two of them over in-memory route interceptions carrying schema-valid payloads, the gb-s4 pattern). The before is the s9 set on record.

## 3. What the owner has now

The /gold page's Signals section is what the answer said it should be: **gold's own technical view** — the interactive chart, the measured note, the price footing — one metal, honestly. Silver stopped competing mid-page and now lives exactly where it has always been true: the ratio seat (with the frozen voter table), the if-you'd-bought row and the London vault's silver row. The OI-4 era — silver's legacy sentence protected on this page — is consciously ended, with the ending itself recorded as the owner's own call (S10-D1/S10-D3).

## 4. Known limitations (the honest list)

1. The interpretation (S10-D2) is the recorded reading of the option's enumeration: the silver items named for retirement retired, and the gold analysis card survives as "the chart". If the owner intended the gold sentence to retire too, it is a one-session change away.
2. The survivor-seat captures for the if-bought and vault planes ride synthesized payloads (schema-valid, in-harness) — the fixture server has no routes for those planes; the LIVE twins (real data) are the deploy's own verification.
3. The fa-string triage queue rides unchanged (round 95 processed its own 2 keys; the standing ~1,298 unreviewed entries are not this session's scope).
4. A real NVDA/VoiceOver pass remains the standing honest limit (the S9 record; the spoken equivalents are suite-pinned).

## 5. The close

The gates 10/10; the branch merged to `main` and pushed; the deploy executed per `docs/DEPLOY.md` with the **D-43 deploy-lock re-check FIRST**, the build, the wrangler deploy, and the live verification (the entry/GoldPage/CSS byte-checks + the live gold-only section check) — the record in `docs/DEPLOY.md`. Credentials used, never stored; the owner should rotate them at their convenience.

**The 9-session program plus its one deferred gate are now fully discharged.** Q2 stays closed by the owner's standing answer.
