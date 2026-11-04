# AGENT_HANDOFF — Currena: the gold balance consolidation program (P5 STAGED behind the owner gate)

> The ACTIVE program is the owner's **gold balance consolidation**
> (`docs/specs/gold-balance-consolidation/`, session plan GB-S1..GB-S7 in
> its `PROMPTS.md`; PROGRESS.md is the authoritative log — its **GB-S6
> session log** is the current state of record). The gap-closure program
> is CLOSED (2026-11-03d; its record: `docs/gap-closure/`).
> Never record credentials here.

## A. The live state (production, verified through GB-S5)

1. **P0–P4 are COMPLETE and LIVE**: through GB-S1..GB-S5 (PR #12, #15,
   #16, #17 + the #18 union, #20 + the #21 record merge; main at
   `eb312c3`). Production serves **currena-api `a803f526` @ 100%**
   (deployment `754dccb6`, GB-S5's deploy). The consolidated balance is
   COMPLETE as a preview at **https://currena.ir/insights?balance=lanes**
   — the redesigned BalanceScale (GB-S4's 05 visual spec), the Outlook
   DERIVED from the balance (GB-S5, `goldOutlookOf`), the copy closed
   (fa rounds 76–78). The DEFAULT view still renders the legacy gold
   card + the two panels (the byte-stability pin held).
2. **P5 (the owner-gated flip) is STAGED, NOT merged, NOT deployed** —
   see A0. The hard gate (04 §3 P5 + AC-12 + V-11) requires the owner's
   explicit "go" **recorded in PROGRESS.md** after their live read of
   the preview (EN + fa, desktop + mobile, light + dark). The Outlook
   word changing for every visitor is exactly why the gate exists
   (D-GB-10).
3. Gates on main at GB-S5's close: ALL 9 GREEN — 14,618 tests (web
   12,659); Insights lazy 1550.94/358.99 (ceiling 1560/360); CHANGELOG
   through [2026-11-04b] (heading count 194).

## A0. The staged flip (branch `gold-balance/p5-flip`, draft PR #22)

The FULL P5 work is staged in two commits (`a299da8` code +
`83adbdb` docs) — the complete inventory is PROGRESS.md's GB-S6 log;
the essentials:

- The `?balance=lanes` gate code RETIRED (`useBalanceLanesPreview`, the
  `balanceLanes` threading, the `visual` prop); BalanceScale's visual
  redesign is the ONLY branch (the whole legacy branch + its tests
  deleted; the pure law helpers stay verbatim).
- `GoldTailwindPanel` + `ModelVsRealityPanel` + their test parts
  DELETED (surviving assertions moved to gold-balance-lanes.test.tsx).
- `goldSummary` still arrives + validates on the wire, unread by the UI
  (AC-9; its retirement is OI-3/GB-S7). `VerdictStrip`'s `goldOutlook`
  prop is REQUIRED; `outlookOf` stays for silver ONLY (OI-4).
- **The collapsed-corner decision (recorded):** the gold summary PROSE
  joined the lane model at BOTH sites (the collapsed line + the merged
  card header; `metalLeanLanes`, fa round-78); silver keeps the legacy
  sentence. Part of the owner's P5 review — a veto reverts with the
  branch.
- Tests: balance 46→22 · outlook 26 · lanes 44→53 = 101/101. Bundle
  re-baselined DOWNWARD 1560/360 → **1535/355** (measured
  1526.97/354.18, `Insights-TjkEDaYV.js`). Harness converted
  (gb-s4-visual's default-view tests + prod-verify's matrix read the
  flipped view + the inert-param proof).
- Docs drafted on the branch: GOLD_SCORE_SPEC §4.4, INDICATORS,
  AGENTS.md, the spec README Status line, DEPLOY.md's [2026-11-04c]
  note (the AT-FLIP-TIME procedure), CHANGELOG [2026-11-04c] (count
  195), the rewritten GB-S7 prompt in PROMPTS.md.

## A-bis. The fresh-environment re-verification (GB-S6b, 2026-11-04)

A continuation session re-verified the staged branch in a FRESH clone:
**ALL 9 GATES GREEN — 14,578 tests** (web 12,619; typecheck 6, lint
0/0, copy:audit clean round-78, narrator in sync, layer1 strict, secret
scan clean, bundle green at 1535/355) + **the gb-s4 standing guards
67/67** (gb-s4-visual 61 + the union probes 6), and CI's `gates` check
is green on the branch head. Environment notes for a fresh machine:
`corepack prepare pnpm@10.34.5 --activate`; `npx playwright install
chromium`; run the gb-s4 harness from `apps/web` with
`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` in the env (the
wrangler webServer). The pre-existing RTL-360 389px document
scrollWidth (the off-canvas side menu) is NOT a balance regression.

## B. What is deliberately left open (the owner's decisions — not tasks)

1. **THE P5 DECISION (the hard gate):** review
   `currena.ir/insights?balance=lanes` — EN + fa, desktop + mobile,
   light + dark — and record the explicit "go" (or the changes) in
   PROGRESS.md. On the "go": merge PR #22 → deploy → the production
   matrix → the final AC-12/V-11 lines → the program close.
2. **OI-1 (asked twice, still OPEN):** the seven Outlook sentences read
   as a forecast ("Signs point to a potential …"), which the backtest
   does not support — 03 §6.3's consequence stands (no advantage
   claimed anywhere). Post-flip, rewording is a normal copy change (the
   proposed conditions wording + fa drafts are in 03 §6.3's table).
3. OI-5's final owner read rides the P5 review (fa rounds 76–78
   fingerprinted). OI-2 (the Split badge) shipped in GB-S4.
4. OI-3 (goldSummary + the wind copy keys retirement) is GB-S7's own
   owner round; its preconditions hold (the GB-S1 recheck record
   exists). OI-4/OI-6 unchanged.
5. The credential rotation (the session-supplied tokens were pasted in
   chat — rotate per the standing owner action item).

## C. The standing constraints (every session)

D-GB-9 (`gold-score.ts`, `goldSummary`, `GoldSummarySchema`,
`snapshot.ts`, `apps/api/**`, the harness tables — never edited), no
edge claimed ever, full `pnpm gates` before every push, the
byte-stable default until the owner-gated flip, fa copy-audit flow
(next: round-79), the parallel-session protocol (pull --rebase before
committing; fetch BEFORE you push).

## D. Git + deployment state

- **main** at `eb312c3` (Merge PR #21, GB-S5's record merge); clean.
- **`gold-balance/p5-flip`** carries the staged flip (draft **PR #22**
  "gold balance(P5): the owner-gated flip — STAGED, awaiting the
  recorded 'go'"; CI `gates` green on the head).
- **Production: currena-api `a803f526` @ 100% (deployment `754dccb6`)**
  — the deploy-lock expectation for the flip session; anything else
  means a parallel session (stop + reconcile first).

## E. Next action (a new session)

**If the owner's "go" is recorded in PROGRESS.md** (the GB-S6 log's
AC-12/V-11 lines): execute DEPLOY.md's [2026-11-04c] AT-FLIP-TIME
procedure verbatim — (1) deploy-lock check (expect `a803f526` @ 100% /
`754dccb6`), (2) merge PR #22 (CI green on branch + main), (3)
`pnpm --filter @currena/web build` + `pnpm --filter @currena/api exec
wrangler deploy` (the owner's credentials from the local gitignored
file or repo secrets — never in the repo), (4) smoke `/api/health` ·
`/` · `/api/insights`, (5) the production matrix `node
visual/prod-verify.mjs` from apps/web (both legs, EN + fa, 360 + 1280,
fresh contexts, ZERO console errors), (6) record the live read + the
AC-12 line in PROGRESS.md and flip the docs' staged wording to LIVE,
close the program (CHANGELOG's next heading; the GB-S7 prompt is
already rewritten on the branch — print it with the 5-line summary).

**If it is NOT recorded:** the gate holds — nothing merges, nothing
deploys. Only non-visible work is allowed (the branch is fully staged;
verify, do not duplicate). Remember the GB-S4 lessons (PROMPTS.md's
lessons log): fetch before you push, hooks stay above every early
return, the frozen contracts win.
