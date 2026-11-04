# AGENT_HANDOFF — Currena: the gold balance consolidation program (DELIVERED — P5 LIVE for every visitor)

> The owner's **gold balance consolidation** program
> (`docs/specs/gold-balance-consolidation/`, session plan GB-S1..GB-S7 in
> its `PROMPTS.md`) is **COMPLETE through P5 and LIVE on production**
> (2026-11-04). The only remaining session is **GB-S7 — OI-3**, its own
> owner round. PROGRESS.md is the authoritative log (its GB-S6 log + the
> final acceptance walk are the state of record). The gap-closure program
> is CLOSED (2026-11-03d; its record: `docs/gap-closure/`).
> Never record credentials here.

## A. The delivered state (verified 2026-11-04, the flip session)

1. **The consolidated lane balance is THE gold card for every visitor on
   currena.ir** — the P5 flip shipped on the owner's recorded "go"
   ("GO, I love the result so far.", after the live preview review):
   **PR #22 merged `4f192c9`** (CI `gates` green on branch + main),
   deployed as **currena-api `0e7d7cb8` @ 100%** (deployment
   `7c6a0315`, 2026-11-04T12:21:01Z; the deploy-lock check cleared
   first against GB-S5's `a803f526`).
2. **The production matrix: 8/8 PASS, ZERO console errors** — both legs
   (the default page + the inert `?balance=lanes` parameter,
   byte-identical in all 4 EN/fa × 360/1280 cells) render the lane
   balance: 4 weights + 4 ledger rows, Balanced/«متعادل», the
   Split/«دوپاره» badge, the lane-derived outlook (neutral) with the
   hedged sentence, AC-8's honesty elements visible without a tap, the
   wind scan clean in both locales, the header lane prose beside the
   balance. The deployed chunk `Insights-B4EBvpCM.js` was fetched from
   currena.ir and measured **1,526,974 bytes — byte-identical to the
   verified local build**.
3. **What shipped in the flip:** the `?balance=lanes` gate code +
   `useBalanceLanesPreview` + the `balanceLanes` threading + the
   `visual` prop + BalanceScale's whole legacy branch RETIRED;
   `GoldTailwindPanel` + `ModelVsRealityPanel` deleted (surviving
   assertions moved to gold-balance-lanes.test.tsx); `goldOutlookOf`
   the only gold Outlook path (`outlookOf` stays for silver, OI-4);
   the collapsed-corner decision LIVE (the gold summary prose on the
   lane model at both sites — `metalLeanLanes`, fa round-78); the
   bundle re-baselined downward 1560/360 → 1535/355 (measured
   1526.97/354.18). `goldSummary` still arrives + validates on the
   wire, unread by the UI (AC-9; its retirement is OI-3/GB-S7).
4. **Gates at the flip:** ALL 9 GREEN — 14,578 tests (web 12,619;
   typecheck 6/6, lint 0/0, copy:audit clean round-78, narrator in
   sync, layer1 strict, secret scan clean, bundle green at 1535/355);
   the gb-s4 standing guards 67/67 (re-verified in a fresh clone by
   the GB-S6b continuation before the go executed).
5. **OI-1 RESOLVED with the go:** "Keep the forecast wording, but with
   hedging language" — the shipped sentences already carry the hedging
   (EN "Signs point to a potential…" / fa «نشانه‌ها حاکی از احتمال…»),
   so they ship UNCHANGED in both locales; the 03 §6.3 consequence
   stands (no advantage claimed anywhere; the measured note + backtest
   link visible). OI-2 (Split) live; OI-5's final owner read rode the
   go (rounds 76–78); OI-4/OI-6 recorded as-is.
6. **One pre-existing, UNRELATED failure flagged for the owner:** the
   scheduled `insights-ingest` GHA run on the merge commit (run
   41827914050, event=schedule — the belt-and-braces venue) failed on
   P1 FX fetches (frankfurter: dollar-basket, usdjpy, audusd, audjpy,
   gold-aud, audnzd — last good values held, flagged stale; the
   designed "product degraded" exit). The Worker's own minute-cron
   (the PRIMARY venue) was healthy — the live snapshot at 12:18Z was
   fresh. A data-source watch item, not a balance regression.

## B. What is deliberately left open (the owner's decisions — not tasks)

1. **GB-S7 / OI-3** — the `goldSummary` wire field + the wind copy keys
   retirement: its own owner round (the preconditions hold — the GB-S1
   recheck record exists). The rewritten prompt is in PROMPTS.md
   (finalized with the exact shipped state); **the owner's explicit
   approval to retire goldSummary + the wind keys is GB-S7's own hard
   gate**.
2. OI-4 (silver's footing circularity) — the recorded candidate for a
   future agenda; out of scope here.
3. The credential rotation (the session-supplied tokens were pasted in
   chat — rotate per the standing owner action item).

## C. The standing constraints (every session)

D-GB-9 (`gold-score.ts`, `goldSummary`, `GoldSummarySchema`,
`snapshot.ts`, `apps/api/**`, the harness tables — never edited without
the recorded approval; GB-S7 may touch the goldSummary-specific pieces
ONLY with the owner's recorded approval), no edge claimed ever, full
`pnpm gates` before every push, fa copy-audit flow (next: round-79),
the parallel-session protocol (pull --rebase before committing; fetch
BEFORE you push).

## D. Git + deployment state

- **main** carries the flip (PR #22, merge `4f192c9`) + this record
  merge (the record PR on `gold-balance/p5-record`).
- **Production: currena-api `0e7d7cb8` @ 100% (deployment
  `7c6a0315`)** — the deploy-lock expectation for GB-S7 (check the
  versions API first; reconcile with DEPLOY.md's newest session note
  if it differs).
- CHANGELOG through [2026-11-04d] (heading count 196, verified).

## E. Next action (a new session)

**GB-S7 — OI-3, the deferred cleanup.** Read PROMPTS.md's GB-S7 prompt
(the finalized version with the exact shipped state) + PROGRESS.md's
GB-S6 log. Its hard gate: the owner's explicit approval to retire
`goldSummary` and the wind copy keys — ask first, record the answer; if
declined or unanswered, report and STOP. On approval: retire the wind
copy keys (03 §6.4's list, trim the moved dictionary-coverage guard
with them, copy:audit clean), then the wire field (a SCHEMA + ingest
change — confirm what GOLD_RECHECK_SPEC §3 expects BEFORE removing
anything; keep stamping or update the procedure in the same PR), full
gates, branch `gold-balance/oi3-cleanup`, PR, merge, deploy
(deploy-lock check first), production verify (the balance must render
identically — the flipped view never read goldSummary), then the
program's FINAL close. Fresh-machine notes: corepack prepare
pnpm@10.34.5 --activate; npx playwright install chromium; the gb-s4
harness needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in the env
and runs from apps/web.
